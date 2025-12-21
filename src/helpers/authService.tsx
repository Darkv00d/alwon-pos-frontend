import { db } from "./db";
import { Selectable } from "kysely";
import { Users } from "./schema";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { generatePasswordHash } from "./generatePasswordHash";

// Re-exporting the user type for convenience in other parts of the app that use this service.
export type User = Selectable<Users>;

const JWT_SECRET = process.env.JWT_SECRET || "default-super-secret-key-for-development";
const JWT_EXPIRATION_TIME = "24h"; // JWT token expiration time

/**
 * Creates a new user in the database.
 * @param email - The user's email address. Must be unique.
 * @param password - The user's plain text password. Will be hashed before storing.
 * @param fullName - The user's full name (optional).
 * @returns The newly created user object.
 * @throws An error if a user with the same email already exists.
 */
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  const existingUser = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select("id")
    .executeTakeFirst();

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await generatePasswordHash(password);

  const newUser = await db
    .insertInto("users")
    .values({
      email,
      passwordHash,
      fullName: fullName || null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  console.log(`User created successfully: ${newUser.email} (UUID: ${newUser.uuid})`);
  return newUser;
}

/**
 * Verifies a user's credentials.
 * @param email - The user's email address.
 * @param password - The user's plain text password.
 * @returns The user object if credentials are valid, otherwise null.
 */
export async function verifyUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await db
    .selectFrom("users")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    console.warn(`Login attempt for non-existent user: ${email}`);
    return null;
  }

  if (!user.isActive) {
    console.warn(`Login attempt for inactive user: ${email}`);
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    console.warn(`Invalid password attempt for user: ${email}`);
    return null;
  }

  return user;
}

/**
 * Creates a new session for a user and returns a JWT.
 * @param userUuid - The UUID of the user to create a session for.
 * @returns An object containing the JWT token and the session ID.
 * @throws An error if the user is not found.
 */
export async function createSession(userUuid: string): Promise<{ token: string; sessionId: string }> {
  const user = await db
    .selectFrom("users")
    .where("uuid", "=", userUuid)
    .select(["uuid"])
    .executeTakeFirst();

  if (!user) {
    throw new Error(`User not found for UUID: ${userUuid}`);
  }

  // Get user roles from user_role table joined with roles table
  const userRoles = await db
    .selectFrom("userRole")
    .innerJoin("roles", "roles.id", "userRole.roleId")
    .where("userRole.userUuid", "=", userUuid)
    .select(["roles.name as roleName"])
    .execute();

  const roles = userRoles.map(role => role.roleName);

  const sessionId = nanoid();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const token = jwt.sign(
    { 
      roles: roles,
      jti: sessionId,
      sub: user.uuid,
      iat: Math.floor(issuedAt.getTime() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRATION_TIME
    }
  );

  await db
    .insertInto("sessions")
    .values({
      id: sessionId,
      userUuid: user.uuid,
      issuedAt,
      expiresAt,
    })
    .execute();

  console.log(`Session created for user ${user.uuid}: ${sessionId}`);
  return { token, sessionId };
}

/**
 * Revokes a user's session.
 * @param sessionId - The ID of the session to revoke.
 * @returns True if the session was found and revoked, otherwise false.
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await db
    .updateTable("sessions")
    .set({ revokedAt: new Date() })
    .where("id", "=", sessionId)
    .where("revokedAt", "is", null)
    .executeTakeFirst();

  if (result.numUpdatedRows > 0) {
    console.log(`Session revoked: ${sessionId}`);
    return true;
  }
  
  console.warn(`Attempted to revoke non-existent or already revoked session: ${sessionId}`);
  return false;
}

/**
 * Verifies a JWT and checks if the corresponding session is valid.
 * @param token - The JWT string to verify.
 * @returns The JWT payload if the token and session are valid, otherwise null.
 */
export async function verifySession(token: string): Promise<jwt.JwtPayload & { roles: string[] } | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { roles: string[] };

    const sessionId = payload.jti;
    if (!sessionId) {
      console.error("JWT verification failed: Token missing jti claim.");
      return null;
    }

    const session = await db
      .selectFrom("sessions")
      .where("id", "=", sessionId)
      .select(["revokedAt", "expiresAt"])
      .executeTakeFirst();

    if (!session) {
      console.warn(`Session not found for JWT (jti: ${sessionId}).`);
      return null;
    }

    if (session.revokedAt) {
      console.warn(`Access attempt with revoked session: ${sessionId}`);
      return null;
    }

    if (new Date() > new Date(session.expiresAt)) {
      console.warn(`Access attempt with expired session: ${sessionId}`);
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      console.error("JWT verification failed:", error.message);
    } else {
      console.error("An unknown error occurred during JWT verification.");
    }
    return null;
  }
}