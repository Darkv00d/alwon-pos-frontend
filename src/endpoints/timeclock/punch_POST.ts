import { z } from "zod";
import superjson from "superjson";
import bcrypt from "bcryptjs";
import { db } from "../../helpers/db";
import { schema, OutputType } from "./punch_POST.schema";
import { sql } from "kysely";
import { startOfDay, endOfDay } from "date-fns";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { employeeCode, pin, locationId } = schema.parse(json);

    // 1. Authenticate Employee
    const employee = await db
      .selectFrom("employees")
      .select(["uuid", "pinHash", "fullName", "defaultLocationId"])
      .where("code", "=", employeeCode)
      .where("status", "=", "active")
      .executeTakeFirst();

    if (!employee || !employee.pinHash) {
      return new Response(
        superjson.stringify({ error: "Código de empleado o PIN inválido." }),
        { status: 401 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, employee.pinHash);
    if (!isPinValid) {
      return new Response(
        superjson.stringify({ error: "Código de empleado o PIN inválido." }),
        { status: 401 }
      );
    }

    // 2. Determine location to use
    const targetLocationId = locationId || employee.defaultLocationId;
    let locationName: string | undefined;
    
    if (targetLocationId) {
      const location = await db
        .selectFrom("locations")
        .select(["name"])
        .where("id", "=", targetLocationId)
        .executeTakeFirst();
      locationName = location?.name;
    }

    // 3. Find the last open time clock entry for the employee
    const lastOpenEntry = await db
      .selectFrom("timeClocks")
      .selectAll()
      .where("employeeUuid", "=", employee.uuid)
      .where("clockOutAt", "is", null)
      .orderBy("clockInAt", "desc")
      .executeTakeFirst();

    const now = new Date();
    let newStatus: "clocked_in" | "clocked_out";
    let lastPunchTime: Date;

    if (lastOpenEntry) {
      // 4. Clock Out: Update the existing entry
      await db
        .updateTable("timeClocks")
        .set({ 
          clockOutAt: now,
          locationId: targetLocationId 
        })
        .where("id", "=", lastOpenEntry.id)
        .execute();
      newStatus = "clocked_out";
      lastPunchTime = now;
    } else {
      // 5. Clock In: Create a new entry
      // Additional validation: Check for recent clock-out to prevent immediate re-punch
      const recentClockOut = await db
        .selectFrom("timeClocks")
        .select(["clockOutAt"])
        .where("employeeUuid", "=", employee.uuid)
        .where("clockOutAt", "is not", null)
        .orderBy("clockOutAt", "desc")
        .executeTakeFirst();

      if (recentClockOut?.clockOutAt) {
        const timeDiff = now.getTime() - new Date(recentClockOut.clockOutAt).getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        // Prevent punch-in within 1 minute of punch-out to avoid accidental double punches
        if (minutesDiff < 1) {
          return new Response(
            superjson.stringify({ error: "Debe esperar al menos 1 minuto antes de marcar entrada nuevamente." }),
            { status: 400 }
          );
        }
      }

      await db
        .insertInto("timeClocks")
        .values({
          employeeUuid: employee.uuid,
          clockInAt: now,
          locationId: targetLocationId,
          source: "kiosk",
        })
        .execute();
      newStatus = "clocked_in";
      lastPunchTime = now;
    }

    // 6. Calculate today's total worked hours
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const result = await db
      .selectFrom("timeClocks")
      .select(
        sql<string>`SUM(EXTRACT(EPOCH FROM (COALESCE("clock_out_at", NOW()) - "clock_in_at")))`.as(
          "totalSeconds"
        )
      )
      .where("employeeUuid", "=", employee.uuid)
      .where("clockInAt", ">=", todayStart)
      .where("clockInAt", "<=", todayEnd)
      .executeTakeFirst();

    const totalSeconds = Number(result?.totalSeconds ?? 0);
    const todaysHours = totalSeconds / 3600;

    const output: OutputType = {
      status: newStatus,
      todaysHours,
      lastPunch: lastPunchTime,
      employeeName: employee.fullName,
      locationName,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Time clock punch error:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ 
          error: "Datos inválidos.", 
          details: error.errors.map(e => e.message) 
        }),
        { status: 400 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}