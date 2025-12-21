import { db } from "../helpers/db";
import { schema, OutputType } from "./loyalty-campaigns_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { productIds, ...campaignData } = schema.parse(json);

    const newCampaign = await db.transaction().execute(async (trx) => {
      const createdCampaign = await trx
        .insertInto('loyaltyCampaigns')
        .values(campaignData)
        .returningAll()
        .executeTakeFirstOrThrow();

      if (productIds && productIds.length > 0) {
        const campaignProducts = productIds.map(productId => ({
          campaignId: createdCampaign.id,
          productId: productId,
        }));
        await trx.insertInto('campaignProducts').values(campaignProducts).execute();
      }

      return createdCampaign;
    });

    return new Response(superjson.stringify(newCampaign satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating loyalty campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create loyalty campaign: ${errorMessage}` }), { status: 400 });
  }
}