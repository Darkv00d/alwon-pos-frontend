import { schema, type OutputType, type SuccessOutputType } from "./timesheets_run_POST.schema";
import superjson from 'superjson';
import { db } from "../../../helpers/db";
import { computeTimesheetForEmployee } from "../../../helpers/payrollCalculations";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required.");
    }

    const json = superjson.parse(await request.text());
    const data = schema.parse(json);

    const results: SuccessOutputType['results'] = [];
    const errors: { employeeUuid: string; error: string }[] = [];

    for (const employeeUuid of data.employeeUuids) {
      try {
        const entries = await computeTimesheetForEmployee(
          employeeUuid,
          new Date(data.periodStart),
          new Date(data.periodEnd)
        );

        const ts = await db.insertInto('timesheets').values({
          employeeUuid: employeeUuid,
          periodId: null, // Assuming period management is separate
          status: 'open'
        }).returning('id').executeTakeFirstOrThrow();
        const timesheetId = ts.id;

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
        
        results.push({ employeeUuid, timesheetId, entryCount: entries.length });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Failed to generate timesheet for employee ${employeeUuid}:`, e);
        errors.push({ employeeUuid, error: errorMessage });
      }
    }

    // Admin audit logging placeholder
    console.log(`Admin user '${user.email}' (ID: ${user.id}) ran timesheets for ${data.employeeUuids.length} employees. Success: ${results.length}, Failures: ${errors.length}.`);

    const output: OutputType = {
      ok: true,
      results,
      errors,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    console.error("Error processing bulk timesheet run:", e);
    let status = 400;
    let message = 'An unexpected error occurred';
    if (e instanceof NotAuthenticatedError) {
      status = 401;
      message = "Not authenticated.";
    } else if (e instanceof Error) {
      message = e.message;
      if (message.startsWith("Unauthorized")) {
        status = 403;
      }
    }
    return new Response(superjson.stringify({ ok: false, error: message } satisfies OutputType), { status });
  }
}