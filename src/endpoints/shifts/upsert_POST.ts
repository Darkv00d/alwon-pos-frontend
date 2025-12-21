import { db } from "../../helpers/db";
import { schema, OutputType } from "./upsert_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    
    const { id, employeeUuids, ...shiftData } = input;

    const result = await db.transaction().execute(async (trx) => {
      let shiftId = id;

      // 1. Upsert the shift record
      if (shiftId) {
        // Update existing shift
        const updatedShift = await trx
          .updateTable('shifts')
          .set({
            ...shiftData,
            startsAt: new Date(shiftData.startsAt),
            endsAt: new Date(shiftData.endsAt),
          })
          .where('id', '=', shiftId)
          .returningAll()
          .executeTakeFirst();
        
        if (!updatedShift) {
          throw new Error(`Shift with ID ${shiftId} not found.`);
        }
      } else {
        // Create new shift - let database auto-generate UUID
        const newShift = await trx
          .insertInto('shifts')
          .values({
            ...shiftData,
            startsAt: new Date(shiftData.startsAt),
            endsAt: new Date(shiftData.endsAt),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        
        shiftId = newShift.id;
      }

      // 2. Clear existing assignments for this shift
      await trx
        .deleteFrom('shiftAssignments')
        .where('shiftId', '=', shiftId)
        .execute();

      // 3. Insert new assignments if any are provided
      if (employeeUuids && employeeUuids.length > 0) {
        const assignments = employeeUuids.map(uuid => ({
          shiftId: shiftId!,
          employeeUuid: uuid,
        }));
        await trx
          .insertInto('shiftAssignments')
          .values(assignments)
          .execute();
      }

      // 4. Fetch the final shift with its assignments to return
      const finalShift = await trx
        .selectFrom('shifts')
        .selectAll()
        .where('id', '=', shiftId)
        .executeTakeFirstOrThrow();

      const finalAssignments = await trx
        .selectFrom('shiftAssignments')
        .select('employeeUuid')
        .where('shiftId', '=', shiftId)
        .execute();

      return {
        ...finalShift,
        employeeUuids: finalAssignments.map(a => a.employeeUuid),
      };
    });

    return new Response(superjson.stringify(result satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in upsert_POST.ts:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: error instanceof Error && error.message.includes('not found') ? 404 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}