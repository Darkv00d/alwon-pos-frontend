import { z } from "zod";
import { db } from "../../helpers/db";
import { schema, type OutputType } from "./upsert_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Employees } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { uuid, pin, ...employeeData } = input;

    let pinHash: string | undefined;
    if (pin) {
      pinHash = await generatePasswordHash(pin);
    }

    let result: Selectable<Employees>;

    if (uuid) {
      // Update existing employee
      const updatedEmployee = await db
        .updateTable('employees')
        .set({ 
          ...employeeData, 
          ...(pinHash && { pinHash }),
          hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : null,
        })
        .where('uuid', '=', uuid)
        .returningAll()
        .executeTakeFirst();

      if (!updatedEmployee) {
        return new Response(superjson.stringify({ error: `Employee with UUID ${uuid} not found.` }), { status: 404 });
      }
      result = updatedEmployee;
    } else {
      // Create new employee
      if (!employeeData.fullName) {
        throw new Error("Full name is required for new employees.");
      }
      result = await db
        .insertInto('employees')
        .values({ 
          ...employeeData, 
          pinHash,
          hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // Exclude password hash from the response
            // Remove sensitive data from response
    const { pinHash: _, ...safeResult } = result;

    return new Response(superjson.stringify(safeResult satisfies OutputType), { status: 200 });
  } catch (error) {
    console.error("Error upserting employee:", error);
    
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data.", details: error.errors }), { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to save employee: ${errorMessage}` }), { status: 500 });
  }
}