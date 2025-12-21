import { type Selectable } from "kysely";
import {
  isSameDay,
  parse,
  isWithinInterval,
  max,
  min,
} from "date-fns";
import {
  startOfDay,
  endOfDay,
  formatDate,
  differenceInMinutes,
  addDays,
} from "./dateUtils";
import { type Holidays, type OvertimeRules, type TimeClocks } from "./schema";
import { db } from "./db";
import { type ComputedTimesheetEntry, type PayrollCalculationInput } from "./payrollTypes";

type ComputeTimesheetInput = PayrollCalculationInput & {
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Computes a detailed timesheet for an employee based on their clock-in/out data,
 * applying overtime, night differential, and holiday rules.
 *
 * @param employeeUuid - The unique identifier for the employee
 * @param periodStart - The start date of the period
 * @param periodEnd - The end date of the period
 * @returns {Promise<ComputedTimesheetEntry[]>} An array of daily timesheet entries.
 */
export const computeTimesheetForEmployee = async (
  employeeUuid: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ComputedTimesheetEntry[]> => {
  if (!employeeUuid) {
    console.error("Employee UUID is required for timesheet computation");
    return [];
  }

  if (!periodStart || !periodEnd) {
    console.error("Period start and end dates are required for timesheet computation");
    return [];
  }

  if (periodStart >= periodEnd) {
    console.error("Period start date must be before end date");
    return [];
  }

  try {
    console.log(`Computing timesheet for employee ${employeeUuid} from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // Query time clocks for the employee within the period
    const timeClocks = await db
      .selectFrom("timeClocks")
      .selectAll()
      .where("employeeUuid", "=", employeeUuid)
      .where("clockInAt", ">=", periodStart)
      .where("clockInAt", "<=", periodEnd)
      .where("clockOutAt", "is not", null)
      .execute();

    if (!timeClocks || timeClocks.length === 0) {
      console.log(`No time clock entries found for employee ${employeeUuid} in the specified period`);
      return [];
    }

    // Query current overtime rules
    const overtimeRulesResult = await db
      .selectFrom("overtimeRules")
      .selectAll()
      .where("effectiveFrom", "<=", periodEnd)
      .where((eb) => 
        eb.or([
          eb("effectiveTo", "is", null),
          eb("effectiveTo", ">=", periodStart)
        ])
      )
      .orderBy("effectiveFrom", "desc")
      .limit(1)
      .executeTakeFirst();

    if (!overtimeRulesResult) {
      throw new Error("No overtime rules found for the specified period. Please configure overtime rules first.");
    }

    // Query holidays within the period
    const holidays = await db
      .selectFrom("holidays")
      .selectAll()
      .where("date", ">=", periodStart)
      .where("date", "<=", periodEnd)
      .execute();

    // Use empty array if no holidays found (this is normal)
    const safeHolidays = holidays || [];

    console.log(`Found ${timeClocks.length} time clock entries, overtime rules effective from ${overtimeRulesResult.effectiveFrom}, and ${safeHolidays.length} holidays`);

    return computeTimesheetFromData({
      timeClocks,
      overtimeRules: overtimeRulesResult,
      holidays: safeHolidays,
    });

  } catch (error) {
    console.error("Error computing timesheet for employee:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to compute timesheet: ${error.message}`);
    } else {
      throw new Error("Failed to compute timesheet due to an unknown error");
    }
  }
};

/**
 * Internal function that performs the actual timesheet computation from fetched data.
 */
const computeTimesheetFromData = ({
  timeClocks,
  overtimeRules,
  holidays,
}: {
  timeClocks: Selectable<TimeClocks>[];
  overtimeRules: Selectable<OvertimeRules>;
  holidays: Selectable<Holidays>[];
}): ComputedTimesheetEntry[] => {
  if (!timeClocks || timeClocks.length === 0) {
    return [];
  }

  if (!overtimeRules) {
    throw new Error("Overtime rules are required for timesheet computation");
  }

  const safeHolidays = holidays || [];
  const holidayDates = new Set(
    safeHolidays.map((h) => formatDate(h.date, "yyyy-MM-dd"))
  );

  const dailyMinutesMap = new Map<
    string,
    { total: number; night: number; isHoliday: boolean }
  >();

  // 1. Process each clock-in/out pair and aggregate minutes per day
  for (const clock of timeClocks) {
    if (!clock.clockInAt || !clock.clockOutAt) {
      console.warn(`Skipping incomplete time clock entry: ${clock.id}`);
      continue;
    }

    let current = new Date(clock.clockInAt);
    const end = new Date(clock.clockOutAt);

    if (current >= end) {
      console.warn(`Invalid time clock entry with clock-in after clock-out: ${clock.id}`);
      continue;
    }

    while (current < end) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);
      const workDateStr = formatDate(dayStart, "yyyy-MM-dd");

      const segmentStart = max([current, dayStart]);
      const segmentEnd = min([end, dayEnd]);

      const totalMinutesInSegment = differenceInMinutes(
        segmentEnd,
        segmentStart
      );
      if (totalMinutesInSegment <= 0) {
        current = addDays(dayStart, 1);
        continue;
      }

      // Calculate night minutes for the segment
      const nightStart = parse(
        overtimeRules.nightStart,
        "HH:mm",
        dayStart
      );
      const nightEnd = parse(overtimeRules.nightEnd, "HH:mm", dayStart);

      let nightMinutesInSegment = 0;
      // Handle night period crossing midnight
      if (nightStart > nightEnd) {
        // Period 1: nightStart to end of day
        const nightInterval1 = { start: nightStart, end: dayEnd };
        const overlap1Start = max([segmentStart, nightInterval1.start]);
        const overlap1End = min([segmentEnd, nightInterval1.end]);
        if (overlap1Start < overlap1End) {
          nightMinutesInSegment += differenceInMinutes(overlap1End, overlap1Start);
        }
        // Period 2: start of day to nightEnd
        const nightInterval2 = { start: dayStart, end: nightEnd };
        const overlap2Start = max([segmentStart, nightInterval2.start]);
        const overlap2End = min([segmentEnd, nightInterval2.end]);
        if (overlap2Start < overlap2End) {
          nightMinutesInSegment += differenceInMinutes(overlap2End, overlap2Start);
        }
      } else {
        // Standard night period within the same day
        const nightInterval = { start: nightStart, end: nightEnd };
        const overlapStart = max([segmentStart, nightInterval.start]);
        const overlapEnd = min([segmentEnd, nightInterval.end]);
        if (overlapStart < overlapEnd) {
          nightMinutesInSegment += differenceInMinutes(overlapEnd, overlapStart);
        }
      }

      const dayData = dailyMinutesMap.get(workDateStr) || {
        total: 0,
        night: 0,
        isHoliday: holidayDates.has(workDateStr),
      };

      dayData.total += totalMinutesInSegment;
      dayData.night += nightMinutesInSegment;
      dailyMinutesMap.set(workDateStr, dayData);

      current = addDays(dayStart, 1);
    }
  }

  // 2. Calculate weekly totals and apply overtime rules
  const weeklyTotals = new Map<number, number>();
  const sortedDays = Array.from(dailyMinutesMap.keys()).sort();

  for (const workDateStr of sortedDays) {
    const workDate = parse(workDateStr, "yyyy-MM-dd", new Date());
    const weekNumber = parseInt(formatDate(workDate, "w"), 10);
    const dayData = dailyMinutesMap.get(workDateStr);
    
    if (!dayData) {
      console.warn(`Missing day data for ${workDateStr}`);
      continue;
    }
    
    const weeklyTotal = weeklyTotals.get(weekNumber) || 0;
    weeklyTotals.set(weekNumber, weeklyTotal + dayData.total);
  }

  // 3. Generate final daily entries with overtime calculations
  const results: ComputedTimesheetEntry[] = [];
  const weeklyMinutesProcessed = new Map<number, number>();

  for (const workDateStr of sortedDays) {
    const workDate = parse(workDateStr, "yyyy-MM-dd", new Date());
    const weekNumber = parseInt(formatDate(workDate, "w"), 10);
    const dayData = dailyMinutesMap.get(workDateStr);

    if (!dayData) {
      console.warn(`Missing day data for ${workDateStr} during final processing`);
      continue;
    }

    let minutesRegular = 0;
    let minutesOvertime = 0;
    let minutesHoliday = 0;

    if (dayData.isHoliday) {
      minutesHoliday = dayData.total;
    } else {
      // Daily Overtime
      const dailyOvertime = Math.max(
        0,
        dayData.total - overtimeRules.dailyThresholdMinutes
      );
      minutesOvertime += dailyOvertime;
      const dailyRegular = dayData.total - dailyOvertime;

      // Weekly Overtime
      const processedThisWeek = weeklyMinutesProcessed.get(weekNumber) || 0;
      const potentialWeeklyRegular = Math.min(
        dailyRegular,
        Math.max(0, overtimeRules.weeklyThresholdMinutes - processedThisWeek)
      );
      
      minutesRegular = potentialWeeklyRegular;
      minutesOvertime += dailyRegular - potentialWeeklyRegular;
      
      weeklyMinutesProcessed.set(weekNumber, processedThisWeek + minutesRegular);
    }

    const totalMinutes = minutesRegular + minutesOvertime + minutesHoliday;
    
    results.push({
      workDate: formatDate(workDate, "yyyy-MM-dd"),
      minutesRegular,
      minutesOvertime,
      minutesNight: dayData.night,
      minutesHoliday,
      totalMinutes,
    });
  }

  console.log(`Generated ${results.length} timesheet entries`);
  return results;
};