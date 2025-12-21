import { db } from "../../helpers/db";
import { OutputType } from "./modules-list_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: "Forbidden: You do not have permission to perform this action." }), { status: 403 });
    }

    const modules = await db.selectFrom('modules').selectAll().execute();
    
    const rolesWithPermissions = await db
      .selectFrom('roles')
      .leftJoin('roleModule', 'roles.id', 'roleModule.roleId')
      .select([
        'roles.id as roleId',
        'roles.name as roleName',
        'roleModule.moduleCode',
        'roleModule.canRead',
        'roleModule.canWrite',
      ])
      .orderBy('roles.name')
      .execute();

    const rolesMap = new Map<number, { id: number; name: string; permissions: { moduleCode: string; canRead: boolean; canWrite: boolean }[] }>();

    for (const row of rolesWithPermissions) {
      if (!rolesMap.has(row.roleId)) {
        rolesMap.set(row.roleId, {
          id: row.roleId,
          name: row.roleName,
          permissions: [],
        });
      }
      if (row.moduleCode) {
        rolesMap.get(row.roleId)!.permissions.push({
          moduleCode: row.moduleCode,
          canRead: !!row.canRead,
          canWrite: !!row.canWrite,
        });
      }
    }

    const roles = Array.from(rolesMap.values());

    return new Response(superjson.stringify({ modules, roles } satisfies OutputType), { status: 200 });

  } catch (error) {
    console.error("Error fetching modules and roles:", error);
    if (error instanceof NotAuthenticatedError) {
        return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch data: ${errorMessage}` }), { status: 500 });
  }
}