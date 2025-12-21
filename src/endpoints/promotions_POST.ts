import { withAuth } from '../helpers/withAuth';
import { db } from '../helpers/db';
import { schema, OutputType, InputType } from "./promotions_POST.schema";
import superjson from "superjson";
import { User } from '../helpers/User';
import { nanoid } from "nanoid";
import { Insertable, Updateable } from "kysely";
import { Promotions } from '../helpers/schema';

async function upsertPromotionHandler(req: Request, user: User) {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Forbidden: Admins only" }),
      { status: 403 }
    );
  }

  try {
    const json = superjson.parse<InputType>(await req.text());
    const { productIds, categoryIds, locationIds, ...promotionData } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      let promotionId = promotionData.id;

      if (promotionId) {
        // Update existing promotion
        console.log(`Updating promotion with ID: ${promotionId}`);
        const updateData: Updateable<Promotions> = {
          ...promotionData,
          // Ensure numeric types are correctly formatted if needed
          discountAmount: promotionData.discountAmount ?
          String(promotionData.discountAmount) :
          null,
          discountPercentage: promotionData.discountPercentage ?
          String(promotionData.discountPercentage) :
          null,
          appliesToAllLocations: promotionData.appliesToAllLocations
        };
        delete (updateData as any).id; // Don't update the ID

        await trx.
        updateTable("promotions").
        set(updateData).
        where("id", "=", promotionId).
        executeTakeFirstOrThrow();
      } else {
        // Create new promotion
        promotionId = nanoid();
        console.log(`Creating new promotion with ID: ${promotionId}`);
        const insertData: Insertable<Promotions> = {
          ...promotionData,
          id: promotionId,
          discountAmount: promotionData.discountAmount ?
          String(promotionData.discountAmount) :
          null,
          discountPercentage: promotionData.discountPercentage ?
          String(promotionData.discountPercentage) :
          null,
          appliesToAllLocations: promotionData.appliesToAllLocations
        };
        await trx.
        insertInto("promotions").
        values(insertData).
        executeTakeFirstOrThrow();
      }

      // Sync related products
      await trx.
      deleteFrom("promotionProducts").
      where("promotionId", "=", promotionId).
      execute();
      if (productIds && productIds.length > 0) {
        const productsToInsert = productIds.map((productId) => ({
          promotionId: promotionId!,
          productId
        }));
        await trx.
        insertInto("promotionProducts").
        values(productsToInsert).
        execute();
      }

      // Sync related categories
      await trx.
      deleteFrom("promotionCategories").
      where("promotionId", "=", promotionId).
      execute();
      if (categoryIds && categoryIds.length > 0) {
        const categoriesToInsert = categoryIds.map((categoryId) => ({
          promotionId: promotionId!,
          categoryId
        }));
        await trx.
        insertInto("promotionCategories").
        values(categoriesToInsert).
        execute();
      }

      // Sync related locations (only if not applying to all)
      await trx.
      deleteFrom("promotionLocations").
      where("promotionId", "=", promotionId).
      execute();
      if (!promotionData.appliesToAllLocations && locationIds && locationIds.length > 0) {
        const locationsToInsert = locationIds.map((locationId) => ({
          promotionId: promotionId!,
          locationId
        }));
        await trx.
        insertInto("promotionLocations").
        values(locationsToInsert).
        execute();
      }

      // Fetch the final state of the promotion to return
      const finalPromotion = await trx.
      selectFrom("promotions").
      selectAll().
      where("id", "=", promotionId).
      executeTakeFirstOrThrow();

      return finalPromotion;
    });

    return new Response(superjson.stringify(result satisfies OutputType));
  } catch (error) {
    console.error("Error upserting promotion:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400
    });
  }
}

export const handle = withAuth(upsertPromotionHandler);