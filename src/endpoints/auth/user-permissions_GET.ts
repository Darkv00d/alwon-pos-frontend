import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { type OutputType } from "./user-permissions_GET.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // Find the role ID for the user's role name.
    const role = await db
      .selectFrom("roles")
      .select("id")
      .where("name", "=", user.role)
      .executeTakeFirst();

    if (!role) {
      // This case might happen if the role in the users table is out of sync with the roles table.
      // Return an empty array as the user has no valid, permissioned role.
      console.warn(`Role '${user.role}' for user '${user.email}' not found in roles table.`);
      return new Response(superjson.stringify([] satisfies OutputType));
    }

    // Fetch all modules and join with the user's role permissions.
    // A LEFT JOIN ensures all modules are returned, with permissions being null
    // if the user's role has no specific entry for that module.
    const permissions = await db
      .selectFrom("modules")
      .leftJoin("roleModule", (join) =>
        join
          .onRef("roleModule.moduleCode", "=", "modules.code")
          .on("roleModule.roleId", "=", role.id)
      )
      .select([
        "modules.code",
        "modules.name",
        "roleModule.canRead",
        "roleModule.canWrite",
      ])
      .orderBy("modules.name", "asc")
      .execute();

    // Coalesce null permissions to false for a consistent API response.
    const userPermissions = permissions.map((p) => ({
      ...p,
      canRead: p.canRead ?? false,
      canWrite: p.canWrite ?? false,
    }));

    return new Response(
      superjson.stringify(userPermissions satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to get user permissions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: errorMessage }),
      { status: 401 } // Unauthorized or session issue
    );
  }
}