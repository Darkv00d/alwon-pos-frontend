import { db } from "./db";
import { getServerUserSession } from "./getServerUserSession";
import { User } from "./User";

/**
 * Custom error class for authorization failures.
 * This should be caught by the endpoint handler to return a 403 Forbidden status.
 */
export class ForbiddenError extends Error {
  constructor(message?: string) {
    super(message ?? "You do not have permission to perform this action.");
    this.name = "ForbiddenError";
  }
}

/**
 * Checks if a user has a specific permission for a given module.
 *
 * @param userUuid - The UUID of the user to check.
 * @param moduleCode - The code of the module (e.g., 'INVENTORY', 'WORKFORCE').
 * @param action - The permission type to check, either 'read' or 'write'.
 * @returns A boolean indicating whether the user has the required permission.
 */
export async function checkModulePermission(
  userUuid: string,
  moduleCode: string,
  action: 'read' | 'write'
): Promise<boolean> {
  // A user with the 'admin' role has universal access.
  const user = await db
    .selectFrom('users')
    .select('role')
    .where('uuid', '=', userUuid)
    .executeTakeFirst();

  if (user?.role === 'admin') {
    return true;
  }

  const permission = await db
    .selectFrom('userRole')
    .innerJoin('roleModule', 'roleModule.roleId', 'userRole.roleId')
    .select(['roleModule.canRead', 'roleModule.canWrite'])
    .where('userRole.userUuid', '=', userUuid)
    .where('roleModule.moduleCode', '=', moduleCode)
    .executeTakeFirst();

  if (!permission) {
    console.log(`No permissions found for user ${userUuid} on module ${moduleCode}.`);
    return false;
  }

  if (action === 'write') {
    return !!permission.canWrite;
  }

  // For 'read' action, write permission also implies read permission.
  return !!permission.canRead || !!permission.canWrite;
}

/**
 * A higher-level helper for endpoints to enforce module-based access control.
 * It authenticates the user and then authorizes them for a specific module and action.
 *
 * @param request - The incoming Request object.
 * @param moduleCode - The code of the module to protect.
 * @param action - The required permission level ('read' or 'write').
 * @returns The authenticated and authorized user's information.
 * @throws {NotAuthenticatedError} if the user is not logged in.
 * @throws {ForbiddenError} if the user lacks the required permission.
 */
export async function requireModuleAccess(
  request: Request,
  moduleCode: string,
  action: 'read' | 'write'
): Promise<{ user: User }> {
  const { user } = await getServerUserSession(request);

  const hasPermission = await checkModulePermission(user.uuid, moduleCode, action);

  if (!hasPermission) {
    console.warn(`Forbidden access attempt by user ${user.uuid} (${user.email}) for module '${moduleCode}' with action '${action}'.`);
    throw new ForbiddenError();
  }

  return { user };
}