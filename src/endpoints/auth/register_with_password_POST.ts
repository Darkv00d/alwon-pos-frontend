import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { createUser, createSession } from "../../helpers/authService";
import { User } from "../../helpers/User";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password, displayName } = schema.parse(json);

    // Create new user using authService
    const newUser = await createUser(email, password, displayName);

    // Assign default "operator" role to new user
    // First, get the operator role ID
    const operatorRole = await db
      .selectFrom("roles")
      .select("id")
      .where("name", "=", "operator")
      .executeTakeFirst();

    if (!operatorRole) {
      throw new Error("Default operator role not found in system");
    }

    // Assign the role to the user
    await db
      .insertInto("userRole")
      .values({
        userUuid: newUser.uuid,
        roleId: operatorRole.id,
      })
      .execute();

    // Create session using authService
    const { token, sessionId } = await createSession(newUser.uuid);

    // Create response with user data (excluding sensitive information)
    const userData: User = {
      uuid: newUser.uuid,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl ?? undefined,
      displayName: newUser.displayName || newUser.fullName || newUser.email.split('@')[0] || 'User',
      role: "operator",
    };

    const response = Response.json({
      user: userData,
    });

    // Set JWT token as HTTP-only cookie
    response.headers.set(
      'Set-Cookie',
      `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`
    );

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    
    if (error instanceof Error) {
      // Handle specific known errors
      if (error.message.includes("already exists")) {
        return Response.json(
          { message: "A user with this email already exists" },
          { status: 409 }
        );
      }
      if (error.message.includes("operator role not found")) {
        return Response.json(
          { message: "System configuration error" },
          { status: 500 }
        );
      }
      return Response.json(
        { message: error.message },
        { status: 400 }
      );
    }
    
    return Response.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}