import { z } from "zod";
import { expirePoints } from "../../helpers/expirePoints";
import { schema, type OutputType } from "./expire-points_POST.schema";
import superjson from 'superjson';
import { withAuth } from "../../helpers/withAuth";
import { User } from "../../helpers/User";

export async function handle(request: Request) {
  // Wrap the handler with authentication - only allow admin users
  const authHandler = async (req: Request, user: User) => {
    // Check if user has admin role
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403 }
      );
    }

    try {
      console.log(`Points expiration triggered by admin: ${user.email}`);
      const result = await expirePoints();

      return new Response(
        superjson.stringify({ 
          success: true, 
          ...result 
        } satisfies OutputType),
        { status: 200 }
      );
    } catch (error) {
      console.error("Error in expire-points endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        superjson.stringify({ error: `Failed to expire points: ${errorMessage}` }),
        { status: 500 }
      );
    }
  };

  return withAuth(authHandler)(request);
}