import { getServerUserSession } from "../../helpers/getServerUserSession";
import { setServerSession, NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    // Use the standardized authentication helper
    const { user, session } = await getServerUserSession(request);

    // Create response with user data
    const response = Response.json({
      user,
    });

    // Update the session cookie to keep it rolling
    // Convert lastAccessed Date to number (timestamp) to match Session interface
    const sessionForCookie = {
      ...session,
      lastAccessed: session.lastAccessed.getTime(),
    };
    await setServerSession(response, sessionForCookie);

    return response;
  } catch (error) {
    console.error("Session validation error:", error);
    
    if (error instanceof NotAuthenticatedError) {
      return Response.json({ error: "No valid session found" }, { status: 401 });
    }
    
    return Response.json(
      { error: "Session validation failed" },
      { status: 500 }
    );
  }
}