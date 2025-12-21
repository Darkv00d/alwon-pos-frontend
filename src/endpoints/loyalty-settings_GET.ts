import { db } from "../helpers/db";
import { OutputType } from "./loyalty-settings_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const settings = await db.selectFrom('loyaltySettings')
      .selectAll()
      .execute();

    return new Response(superjson.stringify(settings satisfies OutputType));
  } catch (error) {
    console.error("Error fetching loyalty settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch loyalty settings: ${errorMessage}` }), { status: 500 });
  }
}