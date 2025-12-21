import { db } from "../helpers/db";
import { schema, type OutputType } from "./leave-requests_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = schema.parse({
      employeeUuid: url.searchParams.get('employeeUuid') || undefined,
      status: url.searchParams.get('status') || undefined,
      type: url.searchParams.get('type') || undefined,
    });

    let query = db.selectFrom('leaveRequests')
      .innerJoin('employees', 'employees.uuid', 'leaveRequests.employeeUuid')
      .select([
        'leaveRequests.id',
        'leaveRequests.employeeUuid',
        'leaveRequests.startsAt',
        'leaveRequests.endsAt',
        'leaveRequests.type',
        'leaveRequests.status',
        'leaveRequests.notes',
        'leaveRequests.approvedBy',
        'leaveRequests.createdAt',
        'employees.fullName as employeeFullName',
      ])
      .orderBy('leaveRequests.startsAt', 'desc');

    if (input.employeeUuid) {
      query = query.where('leaveRequests.employeeUuid', '=', input.employeeUuid);
    }
    if (input.status) {
      query = query.where('leaveRequests.status', '=', input.status);
    }
    if (input.type) {
      query = query.where('leaveRequests.type', '=', input.type);
    }

    const leaveRequests = await query.execute();

    return new Response(superjson.stringify(leaveRequests satisfies OutputType));
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch leave requests: ${errorMessage}` }), { status: 500 });
  }
}