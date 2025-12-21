import superjson from "superjson";
import { db } from "../../../helpers/db";
import { startOfDay, endOfDay } from "../../../helpers/dateUtils";
import { OutputType } from "./punches_today_GET.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required.");
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const punches = await db
      .selectFrom("timeClocks")
      .innerJoin("employees", "employees.uuid", "timeClocks.employeeUuid")
      .leftJoin("employeePositions", (join) =>
        join
          .onRef("employeePositions.employeeUuid", "=", "employees.uuid")
          .on("employeePositions.effectiveTo", "is", null)
      )
      .leftJoin("positions", "positions.id", "employeePositions.positionId")
      .leftJoin("departments", "departments.id", "employeePositions.departmentId")
      .selectAll("timeClocks")
      .select([
        "employees.fullName",
        "employees.code as employeeCode",
        "positions.name as positionName",
        "departments.name as departmentName",
      ])
      .where("timeClocks.clockInAt", ">=", todayStart)
      .where("timeClocks.clockInAt", "<=", todayEnd)
      .orderBy("timeClocks.clockInAt", "desc")
      .execute();

    let totalMinutesWorked = 0;
    let employeesCurrentlyClockedIn = 0;
    const clockedInEmployeeUuids = new Set<string>();

    punches.forEach((p) => {
      if (p.employeeUuid) {
        clockedInEmployeeUuids.add(p.employeeUuid);
      }
      if (p.clockInAt && p.clockOutAt) {
        totalMinutesWorked += (p.clockOutAt.getTime() - p.clockInAt.getTime()) / (1000 * 60);
      } else if (p.clockInAt && !p.clockOutAt) {
        employeesCurrentlyClockedIn++;
        // For currently clocked in, add minutes from clock-in until now
        totalMinutesWorked += (new Date().getTime() - p.clockInAt.getTime()) / (1000 * 60);
      }
    });

    const output: OutputType = {
      punches: punches.map((p) => ({
        ...p,
        clockInAt: p.clockInAt ? new Date(p.clockInAt) : null,
        clockOutAt: p.clockOutAt ? new Date(p.clockOutAt) : null,
        createdAt: new Date(p.createdAt),
      })),
      summary: {
        totalEmployeesClockedIn: clockedInEmployeeUuids.size,
        employeesCurrentlyClockedIn: employeesCurrentlyClockedIn,
        totalHoursWorked: Math.round((totalMinutesWorked / 60) * 100) / 100,
      },
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch today's punches for admin:", error);
    let status = 500;
    let message = "An unexpected error occurred.";
    if (error instanceof NotAuthenticatedError) {
      status = 401;
      message = "Not authenticated.";
    } else if (error instanceof Error) {
      message = error.message;
      if (message.startsWith("Unauthorized")) {
        status = 403;
      }
    }
    return new Response(superjson.stringify({ error: message }), { status });
  }
}