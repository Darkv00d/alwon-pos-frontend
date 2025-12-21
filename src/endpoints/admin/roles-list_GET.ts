import { db } from "../../helpers/db";
import { requireModuleAccess, ForbiddenError } from "../../helpers/moduleAuth";
import { OutputType } from "./roles-list_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    await requireModuleAccess(request, "USER_MANAGEMENT", "read");

    const roles = await db
      .selectFrom("roles")
      .select(["id", "name", "description"])
      .orderBy("name", "asc")
      .execute();

    const response: OutputType = { roles };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch roles list:", error);

    if (error instanceof ForbiddenError) {
      return new Response(
        superjson.stringify({ error: "User does not have permission to view roles" }),
        { status: 403 }
      );
    }
    
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), {
        status: 500,
      });
    }
    
    return new Response(
      superjson.stringify({ error: "An unknown error occurred" }),
      { status: 500 }
    );
  }
}