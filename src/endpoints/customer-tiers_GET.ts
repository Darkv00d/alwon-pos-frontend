import { db } from "../helpers/db";
import { OutputType } from "./customer-tiers_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const customerTiers = await db
      .selectFrom('customerTiers')
      .selectAll()
      .orderBy('minLifetimePoints', 'asc')
      .execute();

    return new Response(superjson.stringify(customerTiers satisfies OutputType));
  } catch (error) {
    console.error("Error fetching customer tiers:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch customer tiers: ${errorMessage}` }), { status: 500 });
  }
}