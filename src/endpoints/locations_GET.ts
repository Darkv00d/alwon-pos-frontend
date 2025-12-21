import { db } from "../helpers/db";
import { type OutputType } from "./locations_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const locations = await db.selectFrom('locations')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return new Response(superjson.stringify(locations satisfies OutputType));
  } catch (error) {
    console.error("Error fetching locations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch locations: ${errorMessage}` }), { status: 500 });
  }
}