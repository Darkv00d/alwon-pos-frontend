import { db } from "../helpers/db";
import { type OutputType } from "./positions_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const positions = await db
      .selectFrom('positions')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return new Response(superjson.stringify(positions satisfies OutputType));
  } catch (error) {
    console.error("Error fetching positions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch positions: ${errorMessage}` }), { status: 500 });
  }
}