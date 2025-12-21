import { verifySession, revokeSession } from "../../helpers/authService";

export async function handle(request: Request) {
  try {
    // Extract JWT token from Authorization header or cookies
    let token: string | null = null;
    
    // First, try Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // If not in header, try cookies
    if (!token) {
      const cookieHeader = request.headers.get("Cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith("auth_token="));
        if (authCookie) {
          token = authCookie.split("=")[1];
        }
      }
    }

    if (!token) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session and get session info
    const sessionPayload = await verifySession(token);
    if (!sessionPayload || !sessionPayload.jti) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Revoke the session
    const revoked = await revokeSession(sessionPayload.jti);
    if (!revoked) {
      console.warn(`Failed to revoke session: ${sessionPayload.jti}`);
      // Continue anyway since the token might already be expired/revoked
    }

    // Create response with success message
    const response = Response.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the auth_token cookie
    response.headers.set(
      "Set-Cookie",
      "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict"
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      {
        error: "Logout failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}