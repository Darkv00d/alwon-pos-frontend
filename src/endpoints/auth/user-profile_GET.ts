import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { type OutputType, type UserProfile } from "./user-profile_GET.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // 1. Fetch all roles for the user
    const userRoles = await db
      .selectFrom("userRole")
      .innerJoin("roles", "userRole.roleId", "roles.id")
      .where("userRole.userUuid", "=", user.uuid)
      .select(["roles.id", "roles.name"])
      .execute();

    const roleIds = userRoles.map((r) => r.id);
    const roleNames = userRoles.map((r) => r.name);

    // 2. Fetch all module permissions for all of the user's roles
    const permissions = await db
      .selectFrom("modules")
      .leftJoin("roleModule", (join) =>
        join
          .onRef("roleModule.moduleCode", "=", "modules.code")
          .on("roleModule.roleId", "in", roleIds)
      )
      .select([
        "modules.code",
        "modules.name",
        "roleModule.canRead",
        "roleModule.canWrite",
      ])
      .groupBy(["modules.code", "modules.name"])
      .select((eb) => [
        // Aggregate permissions: if any role grants access, the user has access.
        eb.fn.max("roleModule.canRead").as("canRead"),
        eb.fn.max("roleModule.canWrite").as("canWrite"),
      ])
      .orderBy("modules.name", "asc")
      .execute();

    // Coalesce null permissions to false and build the final modules list and grants array
    const modules: UserProfile["modules"] = [];
    const grants: UserProfile["grants"] = [];

    for (const p of permissions) {
      const canRead = p.canRead ?? false;
      const canWrite = p.canWrite ?? false;

      modules.push({
        code: p.code,
        name: p.name,
        canRead,
        canWrite,
      });

      if (canRead) {
        grants.push(`${p.code}:read`);
      }
      if (canWrite) {
        grants.push(`${p.code}:write`);
      }
    }

    const userProfile: OutputType = {
      ok: true,
      user: {
        uuid: user.uuid,
        email: user.email,
        displayName: user.displayName,
      },
      roles: roleNames,
      modules,
      grants,
    };

    return new Response(superjson.stringify(userProfile));
  } catch (error) {
    console.error("Failed to get user profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    // Use a structured error response
    return new Response(
      superjson.stringify({ ok: false, error: errorMessage }),
      { status: 401 } // Unauthorized or session issue
    );
  }
}