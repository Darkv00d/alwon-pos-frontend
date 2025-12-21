import { type Selectable } from "kysely";
import { type Users } from "./schema";
import { getServerUserSession } from "./getServerUserSession";
import { NotAuthenticatedError } from "./getSetServerSession";

export type AdminUser = Selectable<Users>;

/**
 * Verifies admin token using Floot's native authentication system with Bearer token fallback.
 * Uses getServerUserSession for primary authentication and falls back to Bearer token support.
 */
export async function verifyAdminToken(
  request: Request
): Promise<AdminUser | null> {
  try {
    // Try native Floot authentication first
    const { user } = await getServerUserSession(request);
    
    // Check if user has admin role (already mapped in getServerUserSession)
    if (user.role !== "admin") {
      console.warn(`Access denied: User ${user.email} does not have admin role. Role: ${user.role}`);
      return null;
    }

    // Get the complete user data from database for AdminUser type compatibility
    const { db } = await import("./db");
    const fullUser = await db
      .selectFrom("users")
      .selectAll()
      .where("uuid", "=", user.uuid)
      .executeTakeFirst();

    if (!fullUser) {
      console.error(`User not found in database for UUID: ${user.uuid}`);
      return null;
    }

    return fullUser;
  } catch (error) {
    // Fallback for Bearer token support
    if (error instanceof NotAuthenticatedError) {
      return await handleBearerTokenFallback(request);
    }
    
    console.error("Admin token verification failed:", error);
    return null;
  }
}

/**
 * Fallback handler for Bearer token authentication.
 * Creates a modified request with Bearer token converted to cookie format for getServerUserSession.
 */
async function handleBearerTokenFallback(
  request: Request
): Promise<AdminUser | null> {
  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const sessionId = authHeader.substring(7);
  if (!sessionId) {
    return null;
  }

  try {
    // Create a modified request with the Bearer token as a cookie
    const modifiedHeaders = new Headers(request.headers);
    const existingCookies = modifiedHeaders.get("cookie") || "";
    const newCookie = existingCookies 
      ? `${existingCookies}; floot_built_app_session=${sessionId}`
      : `floot_built_app_session=${sessionId}`;
    
    modifiedHeaders.set("cookie", newCookie);
    
    const modifiedRequest = new Request(request, {
      headers: modifiedHeaders,
    });

    // Try authentication with modified request
    const { user } = await getServerUserSession(modifiedRequest);
    
    // Check if user has admin role
    if (user.role !== "admin") {
      console.warn(`Bearer token access denied: User ${user.email} does not have admin role. Role: ${user.role}`);
      return null;
    }

    // Get the complete user data from database
    const { db } = await import("./db");
    const fullUser = await db
      .selectFrom("users")
      .selectAll()
      .where("uuid", "=", user.uuid)
      .executeTakeFirst();

    if (!fullUser) {
      console.error(`User not found in database for UUID: ${user.uuid}`);
      return null;
    }

    return fullUser;
  } catch (error) {
    console.warn("Bearer token fallback authentication failed:", error);
    return null;
  }
}