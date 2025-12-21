import { db } from "../../helpers/db";
import { schema, OutputType } from "./role-permissions_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: "Forbidden: You do not have permission to perform this action." }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { roleName, permissions } = input;

    await db.transaction().execute(async (trx) => {
      // Step 1: Find or create the role
      let role = await trx
        .selectFrom('roles')
        .select('id')
        .where('name', '=', roleName)
        .executeTakeFirst();

      if (!role) {
        role = await trx
          .insertInto('roles')
          .values({ name: roleName })
          .returning('id')
          .executeTakeFirstOrThrow();
      }

      const roleId = role.id;

      // Step 2: Upsert module permissions for the role
      if (permissions.length > 0) {
        // To prevent multiple queries in a loop, we can build a single upsert query
        const valuesToUpsert = permissions.map(p => ({
          roleId,
          moduleCode: p.moduleCode,
          canRead: p.canRead,
          canWrite: p.canWrite,
        }));

        await trx
          .insertInto('roleModule')
          .values(valuesToUpsert)
          .onConflict((oc) => oc
            .columns(['roleId', 'moduleCode'])
            .doUpdateSet((eb) => ({
              canRead: eb.ref('excluded.canRead'),
              canWrite: eb.ref('excluded.canWrite'),
            }))
          )
          .execute();
      }
    });

    return new Response(superjson.stringify({ success: true, message: `Successfully updated permissions for role: ${roleName}` } satisfies OutputType), { status: 200 });

  } catch (error) {
    console.error("Error updating role permissions:", error);
    if (error instanceof NotAuthenticatedError) {
        return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update role permissions: ${errorMessage}` }), { status: 400 });
  }
}