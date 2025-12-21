import { db } from "../helpers/db";
import { OutputType, schema } from "./suppliers_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    
    const validatedParams = schema.safeParse(searchParams);
    if (!validatedParams.success) {
      return new Response(
        superjson.stringify({ error: "Invalid parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { q, includeInactive } = validatedParams.data;

    let query = db.selectFrom("suppliers").selectAll();

    // Filter by active status unless includeInactive is true
    if (!includeInactive) {
      query = query.where("isActive", "=", true);
    }

    // Add search functionality if q parameter is provided
    if (q && q.trim()) {
      const searchTerm = q.trim();
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${searchTerm}%`),
          eb("taxId", "ilike", `%${searchTerm}%`),
          eb("email", "ilike", `%${searchTerm}%`)
        ])
      );
    }

    const suppliers = await query.orderBy("name", "asc").execute();

    return new Response(
      superjson.stringify({ suppliers } satisfies OutputType), 
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to fetch suppliers: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}