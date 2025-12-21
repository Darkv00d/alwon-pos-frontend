import { db } from "../helpers/db";
import { schema, type OutputType, type EmployeeWithRelations } from "./employees_GET.schema";
import superjson from 'superjson';
import { sql } from 'kysely';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const input = schema.parse({ search, status });

    let query = db.selectFrom('employees')
      .leftJoin('employeePositions', 'employeePositions.employeeUuid', 'employees.uuid')
      .select([
        'employees.uuid',
        'employees.fullName',
        'employees.email',
        'employees.phone',
        'employees.code',
        'employees.status',
        'employees.hireDate',
        'employees.createdAt',
        'employees.defaultLocationId',
        'employeePositions.departmentId',
        'employeePositions.positionId',
      ])
      // Use a lateral join or a subquery to get only the most recent position
      // For simplicity here, we assume one current position per employee.
      // A more robust solution would handle historical position data.
      .where('employeePositions.effectiveTo', 'is', null)
      .orderBy('employees.fullName', 'asc');

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      query = query.where((eb) => eb.or([
        eb('employees.fullName', 'ilike', searchTerm),
        eb('employees.email', 'ilike', searchTerm),
        eb('employees.code', 'ilike', searchTerm),
      ]));
    }

    if (input.status) {
      query = query.where('employees.status', '=', input.status);
    }

  const employees = await query.execute();

  const employeesWithPinHash = employees.map(emp => ({
    ...emp,
    pinHash: null // Never expose PIN hash to frontend
  }));

  return new Response(superjson.stringify(employeesWithPinHash satisfies EmployeeWithRelations[]));
  } catch (error) {
    console.error("Error fetching employees:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch employees: ${errorMessage}` }), { status: 500 });
  }
}