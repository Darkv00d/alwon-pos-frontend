import { schema, type OutputType } from "./timesheet_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { computeTimesheetForEmployee } from "../../helpers/payrollCalculations";

export async function handle(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const entries = await computeTimesheetForEmployee(
      data.employeeUuid,
      new Date(data.periodStart),
      new Date(data.periodEnd)
    );

    let timesheetId: string | null = null;
    if (data.createTimesheet) {
      const ts = await db.insertInto('timesheets').values({
        employeeUuid: data.employeeUuid,
        periodId: null,
        status: 'open'
      }).returning('id').executeTakeFirstOrThrow();
      timesheetId = ts.id;

      for (const e of entries) {
        await db.insertInto('timesheetEntries').values({
          timesheetId,
          workDate: new Date(e.workDate),
          minutesRegular: e.minutesRegular,
          minutesOvertime: e.minutesOvertime,
          minutesNight: e.minutesNight,
          minutesHoliday: e.minutesHoliday
        }).execute();
      }
    }

    return new Response(superjson.stringify({ ok: true, timesheetId, entries } satisfies OutputType));
  } catch (e: unknown) {
    console.error("Error processing timesheet:", e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return new Response(superjson.stringify({ ok: false, error: errorMessage } satisfies OutputType), { status: 400 });
  }
}