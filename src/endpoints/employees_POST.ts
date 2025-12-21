import { z } from "zod";
import { db } from "../helpers/db";
import { schema, type OutputType } from "./employees_POST.schema";
import { generatePasswordHash } from "../helpers/generatePasswordHash";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB } from "../helpers/schema";

async function createOrUpdateEmployee(
  trx: Transaction<DB>,
  input: z.infer<typeof schema>
) {
  const { uuid, departmentId, positionId, pin, ...employeeData } = input;

  let pinHash: string | undefined;
  if (pin) {
    pinHash = await generatePasswordHash(pin);
  }

  let employeeResult;

  if (uuid) {
    // Update existing employee
    employeeResult = await trx
      .updateTable('employees')
      .set({ ...employeeData, ...(pinHash && { pinHash }) })
      .where('uuid', '=', uuid)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update position/department
    if (departmentId !== undefined || positionId !== undefined) {
      // Invalidate old position
      await trx
        .updateTable('employeePositions')
        .set({ effectiveTo: new Date() })
        .where('employeeUuid', '=', uuid)
        .where('effectiveTo', 'is', null)
        .execute();
      
      // Insert new position if provided
      if (positionId && departmentId) {
        await trx
          .insertInto('employeePositions')
          .values({
            employeeUuid: uuid,
            positionId: positionId,
            departmentId: departmentId,
            effectiveFrom: new Date(),
          })
          .execute();
      }
    }
  } else {
    // Create new employee
    if (!pinHash) {
      throw new Error("A PIN is required for new employees.");
    }
    employeeResult = await trx
      .insertInto('employees')
      .values({ ...employeeData, pinHash })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Assign position/department if provided
    if (positionId && departmentId) {
      await trx
        .insertInto('employeePositions')
        .values({
          employeeUuid: employeeResult.uuid,
          positionId: positionId,
          departmentId: departmentId,
          effectiveFrom: new Date(),
        })
        .execute();
    }
  }

  // Fetch the final state with relations
  const finalEmployee = await trx.selectFrom('employees')
    .leftJoin('employeePositions', 'employeePositions.employeeUuid', 'employees.uuid')
    .selectAll('employees')
    .select(['employeePositions.departmentId', 'employeePositions.positionId'])
    .where('employees.uuid', '=', employeeResult.uuid)
    .where('employeePositions.effectiveTo', 'is', null)
    .executeTakeFirstOrThrow();

  return finalEmployee;
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      return createOrUpdateEmployee(trx, input);
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 200 });
  } catch (error) {
    console.error("Error saving employee:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to save employee: ${errorMessage}` }), { status: 400 });
  }
}