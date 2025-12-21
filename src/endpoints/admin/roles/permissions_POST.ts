import { z } from "zod";
import superjson from 'superjson';
import { db } from "../../../helpers/db";
import { schema, OutputType } from "./permissions_POST.schema";
import { requireModuleAccess, ForbiddenError } from "../../../helpers/moduleAuth";

export async function handle(request: Request) {
  try {
    await requireModuleAccess(request, 'ADMIN', 'write');

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { roleName, modules } = input;

    const result = await db.transaction().execute(async (trx) => {
      // Step 1: Upsert the role and get its ID.
      // We use `ON CONFLICT...DO UPDATE` to ensure we get the ID back whether it's a new or existing role.
      const role = await trx
        .insertInto('roles')
        .values({ name: roleName })
        .onConflict((oc) => oc
          .column('name')
          .doUpdateSet({ name: roleName }) // Dummy update to ensure RETURNING works
        )
        .returning('id')
        .executeTakeFirstOrThrow();

      const roleId = role.id;

      // Step 2: Validate that all provided module codes exist in the 'modules' table.
      const moduleCodes = modules.map(m => m.code);
      const existingModules = await trx
        .selectFrom('modules')
        .select('code')
        .where('code', 'in', moduleCodes)
        .execute();

      if (existingModules.length !== moduleCodes.length) {
        const existingModuleCodes = new Set(existingModules.map(m => m.code));
        const invalidCodes = moduleCodes.filter(code => !existingModuleCodes.has(code));
        throw new Error(`Invalid module codes provided: ${invalidCodes.join(', ')}`);
      }

      // Step 3: Upsert module permissions for the role.
      // This will insert new permissions or update existing ones in a single batch.
      if (modules.length > 0) {
        const permissionsToUpsert = modules.map(mod => ({
          roleId: roleId,
          moduleCode: mod.code,
          canRead: mod.canRead,
          canWrite: mod.canWrite,
        }));

        await trx
          .insertInto('roleModule')
          .values(permissionsToUpsert)
          .onConflict((oc) => oc
            .columns(['roleId', 'moduleCode'])
            .doUpdateSet((eb) => ({
              canRead: eb.ref('excluded.canRead'),
              canWrite: eb.ref('excluded.canWrite'),
            }))
          )
          .execute();
      }

      return { roleId };
    });

    return new Response(superjson.stringify({ ok: true, roleId: result.roleId } satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error setting role permissions:", error);

    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data.", details: error.errors }), { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 403 });
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to set permissions: ${errorMessage}` }), { status: 500 });
  }
}