/**
 * @file helpers/payrollTypes.tsx
 * @description Shared TypeScript types for payroll calculations.
 * This file contains pure TypeScript types and interfaces that can be used across
 * both the frontend and backend for consistency in handling payroll data.
 * It has no dependencies on database schemas or other backend-specific code.
 */

/**
 * Represents a single entry in a computed timesheet, typically for one workday.
 * All durations are in minutes for precision.
 */
export interface ComputedTimesheetEntry {
  /** The specific date for this entry, in ISO 8601 format (YYYY-MM-DD). */
  workDate: string;
  /** Total regular minutes worked on this day. */
  minutesRegular: number;
  /** Total overtime minutes worked on this day. */
  minutesOvertime: number;
  /** Total minutes worked during night shift hours on this day. */
  minutesNight: number;
  /** Total minutes worked on a designated holiday. */
  minutesHoliday: number;
  /** The sum of all minute categories for this day. */
  totalMinutes: number;
}

/**
 * Defines the structure for a payroll period.
 */
export interface PayrollPeriod {
  /** The start date of the period, inclusive, in ISO 8601 format (YYYY-MM-DD). */
  startDate: string;
  /** The end date of the period, inclusive, in ISO 8601 format (YYYY-MM-DD). */
  endDate: string;
}

/**
 * Represents the summary of all computed work minutes over a payroll period.
 */
export interface PayrollCalculationSummary {
  /** Sum of all regular minutes worked in the period. */
  totalMinutesRegular: number;
  /** Sum of all overtime minutes worked in the period. */
  totalMinutesOvertime: number;
  /** Sum of all night shift minutes worked in the period. */
  totalMinutesNight: number;
  /** Sum of all holiday minutes worked in the period. */
  totalMinutesHoliday: number;
  /** The grand total of all minutes worked across all categories in the period. */
  totalMinutesWorked: number;
}

/**
 * Defines the input required to perform a payroll timesheet calculation for an employee.
 */
export interface PayrollCalculationInput extends PayrollPeriod {
  /** The unique identifier for the employee. */
  employeeUuid: string;
}

/**
 * Represents the complete output of a payroll timesheet calculation for a single employee.
 * This is the primary data structure used to display payroll reports.
 */
export interface PayrollCalculationOutput {
  /** The unique identifier for the employee this report belongs to. */
  employeeUuid: string;
  /** The payroll period for which the calculation was performed. */
  period: PayrollPeriod;
  /** A detailed list of computed entries for each day worked within the period. */
  entries: ComputedTimesheetEntry[];
  /** An aggregate summary of all work minutes for the entire period. */
  summary: PayrollCalculationSummary;
}