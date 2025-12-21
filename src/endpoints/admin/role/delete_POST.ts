import { db } from '../../../helpers/db';
import { schema, OutputType } from "./delete_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../helpers/getSetServerSession';
import { ZodError } from "zod";

// System-critical roles that should not be deleted.
const PROTECTED_ROLES = ['admin', 'manager', 'operator', 'user'];

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: "Forbidden: You do not have permission to perform this action." }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const { roleId } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // Step 1: Verify the role exists and is not a protected system role.
      const role = await trx.
      selectFrom('roles').
      select(['id', 'name']).
      where('id', '=', roleId).
      executeTakeFirst();

      if (!role) {
        return { status: 404, body: { error: "Role not found." } };
      }

      if (PROTECTED_ROLES.includes(role.name.toLowerCase())) {
        return { status: 400, body: { error: `Cannot delete a protected system role: ${role.name}.` } };
      }

      // Step 2: Verify no users are assigned to this role.
      // Note: We check the `userRole` mapping table, not the `users.role` string column.
      const userCount = await trx.
      selectFrom('userRole').
      select(db.fn.count('userUuid').as('count')).
      where('roleId', '=', roleId).
      executeTakeFirst();

      if (userCount && Number(userCount.count) > 0) {
        return { status: 400, body: { error: `Cannot delete role. ${userCount.count} user(s) are still assigned to it.` } };
      }

      // Step 3: Delete all associated module permissions for the role.
      await trx.
      deleteFrom('roleModule').
      where('roleId', '=', roleId).
      execute();

      // Step 4: Delete the role itself.
      const deleteResult = await trx.
      deleteFrom('roles').
      where('id', '=', roleId).
      executeTakeFirst();

      if (deleteResult.numDeletedRows === 0n) {
        // This case should ideally not be reached due to the initial check, but it's good for safety.
        return { status: 404, body: { error: "Role not found during deletion." } };
      }

      return { status: 200, body: { success: true, message: "Role deleted successfully." } satisfies OutputType };
    });

    return new Response(superjson.stringify(result.body), { status: result.status });

  } catch (error) {
    console.error("Error deleting role:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to delete role: ${errorMessage}` }), { status: 500 });
  }
}