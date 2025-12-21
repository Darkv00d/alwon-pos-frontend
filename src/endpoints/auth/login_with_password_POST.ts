// adapt this to your database schema
import { db } from "../../helpers/db";
import { schema } from "./login_with_password_POST.schema";
import { verifyUser, createSession } from "../../helpers/authService";
import { User } from "../../helpers/User";
import { setServerSession } from "../../helpers/getSetServerSession";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "../../helpers/rateLimit";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password } = schema.parse(json);

    // Normalize email to lowercase for consistent handling
    const normalizedEmail = email.toLowerCase();

    // Apply centralized rate limiting
    const rateLimitResponse = await applyRateLimit(
      request, 
      RATE_LIMIT_CONFIGS.LOGIN, 
      normalizedEmail
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Use authService to verify user credentials
    const user = await verifyUser(normalizedEmail, password);

    if (!user) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Authentication successful - create session using authService
    try {
      const sessionData = await createSession(user.uuid);
      
      // Create response with user data compatible with existing frontend
      const userData: User = {
        uuid: user.uuid,
        email: user.email,
        avatarUrl: user.avatarUrl ?? undefined,
        displayName: user.displayName || user.fullName || user.email.split('@')[0] || 'User',
        role: user.role as User["role"], // authService already validates the user is active
      };

      const response = Response.json({
        user: userData,
      });

      // Create Session object for proper session management
      const now = Date.now();
      const session = {
        id: sessionData.sessionId,
        createdAt: now,
        lastAccessed: now,
      };

      // Use setServerSession to set the proper floot_built_app_session cookie
      await setServerSession(response, session);

      // Clear legacy auth_token cookie to ensure clean authentication state
      const legacyClearCookie = [
        "auth_token=",
        "HttpOnly",
        "Secure", 
        "SameSite=Strict",
        "Path=/",
        "Max-Age=0", // Expire immediately
      ].join("; ");
      
      response.headers.append("Set-Cookie", legacyClearCookie);

      console.log(`User ${user.email} logged in successfully with session ${sessionData.sessionId}`);
      return response;
    } catch (sessionError) {
      console.error("Failed to create session:", sessionError);
      return Response.json(
        { message: "Failed to create session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Login endpoint error:", error);
    return Response.json({ message: "Authentication failed" }, { status: 400 });
  }
}