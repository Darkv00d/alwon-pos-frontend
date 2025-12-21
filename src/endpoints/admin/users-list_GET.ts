import superjson from 'superjson';
import { db } from '../../helpers/db';
import { requireModuleAccess, ForbiddenError } from '../../helpers/moduleAuth';
import { OutputType } from './users-list_GET.schema';

export async function handle(request: Request) {
  try {
    await requireModuleAccess(request, 'ADMIN', 'read');

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q');

    let usersQuery = db
      .selectFrom('users')
      .selectAll('users');

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      usersQuery = usersQuery.where((eb) =>
        eb.or([
          eb('fullName', 'ilike', searchPattern),
          eb('email', 'ilike', searchPattern),
          eb('identificationnumber', 'ilike', searchPattern)
        ])
      );
    }

    const users = await usersQuery.execute();

    const userRoles = await db
      .selectFrom('userRole')
      .innerJoin('roles', 'roles.id', 'userRole.roleId')
      .select(['userRole.userUuid', 'roles.name as roleName'])
      .execute();

    const rolesByUuid = userRoles.reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.userUuid]) {
        acc[row.userUuid] = [];
      }
      acc[row.userUuid].push(row.roleName);
      return acc;
    }, {});

    const usersWithRoles = users.map(user => ({
      ...user,
      // Kysely maps snake_case to camelCase
      identificationType: user.identificationtype,
      identificationNumber: user.identificationnumber,
      dateOfBirth: user.dateofbirth,
      roleNames: rolesByUuid[user.uuid] || [],
    }));

    return new Response(superjson.stringify({ users: usersWithRoles } satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching user list:", error);
    if (error instanceof ForbiddenError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 403 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch users: ${errorMessage}` }), { status: 500 });
  }
}