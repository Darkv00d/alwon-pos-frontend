import { getServerUserSession } from "./getServerUserSession";
import { User } from "./User";

type AuthenticatedRequest = (
  req: Request,
  user: User
) => Promise<Response> | Response;

export function withAuth(handler: AuthenticatedRequest) {
  return async (req: Request) => {
    try {
      const { user } = await getServerUserSession(req);
      return handler(req, user);
    } catch (error) {
      console.error("Auth error:", error);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}