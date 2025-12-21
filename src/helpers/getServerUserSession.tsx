import { db } from "./db";
import { User } from "./User";

import {
  CleanupProbability,
  getServerSessionOrThrow,
  NotAuthenticatedError,
  SessionExpirationSeconds,
} from "./getSetServerSession";

// Helper function to map database roles to UI roles with comprehensive coverage
function mapDatabaseRoleToUserRole(role: string): User["role"] {
  // Direct role mappings for database roles to UI roles
  const roleMapping: Record<string, User["role"]> = {
    // Database roles mapped to UI roles
    admin_general: "admin",
    supervisor: "manager",
    operario: "operator",
    custom: "user",
    
    // Direct role names for backward compatibility
    admin: "admin",
    manager: "manager",
    operator: "operator",
    user: "user",
  };

  const mappedRole = roleMapping[role];
  if (mappedRole) {
    return mappedRole;
  }

  // Default fallback for unmapped roles - gracefully handle by defaulting to "user"
  console.warn(`Unknown database role: ${role}, defaulting to "user"`);
  return "user";
}

export async function getServerUserSession(request: Request) {
  const session = await getServerSessionOrThrow(request);

  // Occasionally clean up expired sessions
  if (Math.random() < CleanupProbability) {
    const expirationDate = new Date(
      Date.now() - SessionExpirationSeconds * 1000
    );
    try {
      await db
        .deleteFrom("sessions")
        .where("lastAccessed", "<", expirationDate)
        .execute();
    } catch (cleanupError) {
      // Log but don't fail the request if cleanup fails
      console.error("Session cleanup error:", cleanupError);
    }
  }

  // Query the sessions and users tables in a single join query
  const results = await db
    .selectFrom("sessions")
    .innerJoin("users", "sessions.userUuid", "users.uuid")
    .select([
      "sessions.id as sessionId",
      "sessions.createdAt as sessionCreatedAt",
      "sessions.lastAccessed as sessionLastAccessed",
      "users.id",
      "users.uuid",
      "users.email",
      "users.displayName",
      "users.role",
      "users.avatarUrl",
    ])
    .where("sessions.id", "=", session.id)
    .limit(1)
    .execute();

  if (results.length === 0) {
    throw new NotAuthenticatedError();
  }

  const result = results[0];
  const user = {
    id: result.id,
    uuid: result.uuid,
    email: result.email,
    displayName: result.displayName || result.email.split('@')[0] || 'User',
    avatarUrl: result.avatarUrl ?? undefined,
    role: mapDatabaseRoleToUserRole(result.role),
  };

  // Update the session's lastAccessed timestamp
  const now = new Date();
  await db
    .updateTable("sessions")
    .set({ lastAccessed: now })
    .where("id", "=", session.id)
    .execute();

  return {
    user: user satisfies User,
    // make sure to update the session in cookie
    session: {
      ...session,
      lastAccessed: now,
    },
  };
}
