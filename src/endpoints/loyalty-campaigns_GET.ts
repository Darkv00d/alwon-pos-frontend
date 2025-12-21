import { db } from "../helpers/db";
import { schema, OutputType } from "./loyalty-campaigns_GET.schema";
import superjson from 'superjson';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { sql } from 'kysely';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get('isActive') === 'true' ? true : url.searchParams.get('isActive') === 'false' ? false : undefined;
    const includeProducts = url.searchParams.get('includeProducts') === 'true';

    const input = schema.parse({ isActive, includeProducts });

    let query = db.selectFrom('loyaltyCampaigns').selectAll('loyaltyCampaigns');

    if (input.isActive === true) {
      const now = new Date();
      query = query.where('startDate', '<=', now).where('endDate', '>=', now);
    } else if (input.isActive === false) {
      const now = new Date();
      query = query.where((eb) => eb.or([
        eb('startDate', '>', now),
        eb('endDate', '<', now)
      ]));
    }

    if (input.includeProducts) {
      query = query.select((eb) => [
        sql<number[]>`(
          SELECT COALESCE(JSON_AGG(product_id), '[]'::json)
          FROM campaign_products
          WHERE campaign_products.campaign_id = loyalty_campaigns.id
        )`.as('productIds')
      ]);
    }

    const campaigns = await query.orderBy('startDate', 'desc').execute();

    return new Response(superjson.stringify(campaigns satisfies OutputType));
  } catch (error) {
    console.error("Error fetching loyalty campaigns:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch loyalty campaigns: ${errorMessage}` }), { status: 500 });
  }
}