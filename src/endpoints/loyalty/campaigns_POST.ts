import { db } from "../../helpers/db";
import { schema, type OutputType } from "./campaigns_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';
import { type Transaction } from "kysely";
import { type DB } from "../../helpers/schema";

async function upsertCampaign(
  data: import('./campaigns_POST.schema').InputType,
  campaignId: string,
  trx: Transaction<DB>
) {
  const campaignValues = {
    id: campaignId,
    name: data.name,
    description: data.description || null,
    startDate: data.startDate,
    endDate: data.endDate,
    pointsMultiplier: data.pointsMultiplier.toString(),
    isActive: data.isActive ?? true,
  };

  await trx
    .insertInto("loyaltyCampaigns")
    .values(campaignValues)
    .onConflict((oc) => oc
      .column("id")
      .doUpdateSet(campaignValues)
    )
    .execute();
}

async function updateCampaignProducts(
  productIds: number[] | undefined,
  campaignId: string,
  trx: Transaction<DB>
) {
  // Always clear existing products for simplicity.
  await trx
    .deleteFrom("campaignProducts")
    .where("campaignId", "=", campaignId)
    .execute();

  if (productIds && productIds.length > 0) {
    await trx
      .insertInto("campaignProducts")
      .values(
        productIds.map((productId) => ({
          campaignId,
          productId,
        }))
      )
      .execute();
  }
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const data = schema.parse(json);

    const campaignId = data.id || nanoid();

    await db.transaction().execute(async (trx) => {
      await upsertCampaign(data, campaignId, trx);
      await updateCampaignProducts(data.productIds, campaignId, trx);
    });

    return new Response(
      superjson.stringify({ success: true, campaignId } satisfies OutputType),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error managing campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      superjson.stringify({ error: `Failed to manage campaign: ${errorMessage}` }),
      { status: 400 }
    );
  }
}