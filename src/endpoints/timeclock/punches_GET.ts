import superjson from "superjson";
import { db } from "../../helpers/db";
import { startOfDay, endOfDay } from "../../helpers/dateUtils";
import { OutputType } from "./punches_GET.schema";
import { Selectable } from "kysely";
import { Employees, TimeClocks } from "../../helpers/schema";

export type PunchWithEmployee = Selectable<TimeClocks> & {
  employee?: Pick<Selectable<Employees>, "fullName" | "code">;
};

export async function handle(_request: Request) {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const punches = await db
      .selectFrom("timeClocks")
      .leftJoin("employees", "employees.uuid", "timeClocks.employeeUuid")
      .select([
        "timeClocks.id",
        "timeClocks.employeeUuid",
        "timeClocks.clockInAt",
        "timeClocks.clockOutAt",
        "timeClocks.locationId",
        "timeClocks.notes",
        "timeClocks.source",
        "timeClocks.createdAt",
        "employees.fullName",
        "employees.code as employeeCode",
      ])
      .where("timeClocks.clockInAt", ">=", todayStart)
      .where("timeClocks.clockInAt", "<=", todayEnd)
      .orderBy("timeClocks.clockInAt", "desc")
      .execute();

    const output: OutputType = {
      punches: punches.map((p) => ({
        ...p,
        // Ensure clockInAt and clockOutAt are Date objects
        clockInAt: p.clockInAt ? new Date(p.clockInAt) : null,
        clockOutAt: p.clockOutAt ? new Date(p.clockOutAt) : null,
        createdAt: new Date(p.createdAt),
      })),
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch time clock punches:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}