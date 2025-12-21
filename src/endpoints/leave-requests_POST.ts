import { db } from "../helpers/db";
import { schema, type OutputType } from "./leave-requests_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let leaveRequestId: string;

    if ('employeeUuid' in input) { // Create or Update
      const dataToUpsert = {
        employeeUuid: input.employeeUuid,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        type: input.type,
        notes: input.notes,
        status: 'pending' as const,
      };

      if (input.id) { // Update
        await db.updateTable('leaveRequests')
          .set(dataToUpsert)
          .where('id', '=', input.id)
          .executeTakeFirstOrThrow();
        leaveRequestId = input.id;
      } else { // Create
        const newId = nanoid();
        await db.insertInto('leaveRequests')
          .values({ ...dataToUpsert, id: newId })
          .executeTakeFirstOrThrow();
        leaveRequestId = newId;
      }
    } else { // Approve or Reject
      await db.updateTable('leaveRequests')
        .set({
          status: input.status,
          approvedBy: input.approvedBy,
        })
        .where('id', '=', input.id)
        .executeTakeFirstOrThrow();
      leaveRequestId = input.id;
    }

    const updatedRequest = await db.selectFrom('leaveRequests')
      .innerJoin('employees', 'employees.uuid', 'leaveRequests.employeeUuid')
      .selectAll('leaveRequests')
      .select('employees.fullName as employeeFullName')
      .where('leaveRequests.id', '=', leaveRequestId)
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedRequest satisfies OutputType));
  } catch (error) {
    console.error("Error processing leave request:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to process leave request: ${errorMessage}` }), { status: 500 });
  }
}