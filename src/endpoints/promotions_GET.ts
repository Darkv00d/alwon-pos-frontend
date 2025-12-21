import { withAuth } from '../helpers/withAuth';
import { db } from '../helpers/db';
import { schema, OutputType } from "./promotions_GET.schema";
import superjson from "superjson";
import { User } from '../helpers/User';
import { sql } from "kysely";

async function getPromotionsHandler(req: Request, user: User) {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Forbidden: Admins only" }),
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const { active, promotionType, search } = schema.parse({
      active: url.searchParams.get("active") ?
      url.searchParams.get("active") === "true" :
      undefined,
      promotionType: url.searchParams.get("promotionType") || undefined,
      search: url.searchParams.get("search") || undefined
    });

    let query = db.selectFrom("promotions").selectAll();

    if (active !== undefined) {
      query = query.where("isActive", "=", active);
    }
    if (promotionType) {
      query = query.where("promotionType", "=", promotionType);
    }
    if (search) {
      query = query.where((eb) =>
      eb.or([
      eb("name", "ilike", `%${search}%`),
      eb("description", "ilike", `%${search}%`)]
      )
      );
    }

    const promotions = await query.orderBy("createdAt", "desc").execute();

    if (promotions.length === 0) {
      return new Response(superjson.stringify([] satisfies OutputType));
    }

    const promotionIds = promotions.map((p) => p.id);

    const products = await db.
    selectFrom("promotionProducts").
    innerJoin("products", "products.id", "promotionProducts.productId").
    where("promotionProducts.promotionId", "in", promotionIds).
    select([
    "promotionProducts.promotionId",
    "products.id",
    "products.name",
    "products.sku"]
    ).
    execute();

    const categories = await db.
    selectFrom("promotionCategories").
    innerJoin(
      "categories",
      "categories.id",
      "promotionCategories.categoryId"
    ).
    where("promotionCategories.promotionId", "in", promotionIds).
    select(["promotionCategories.promotionId", "categories.id", "categories.name"]).
    execute();

    const locations = await db
      .selectFrom("promotionLocations")
      .innerJoin("locations", "locations.id", "promotionLocations.locationId")
      .where("promotionLocations.promotionId", "in", promotionIds)
      .select([
        "promotionLocations.promotionId",
        "locations.id",
        "locations.name",
        "locations.code",
        "locations.locationType"
      ])
      .execute();

    const results: OutputType = promotions.map((promo) => ({
      ...promo,
      products: products.
      filter((p) => p.promotionId === promo.id).
      map(({ promotionId, ...rest }) => rest),
      categories: categories.
      filter((c) => c.promotionId === promo.id).
      map(({ promotionId, ...rest }) => rest),
      locations: locations.
      filter((l) => l.promotionId === promo.id).
      map(({ promotionId, ...rest }) => rest)
    }));

    return new Response(superjson.stringify(results));
  } catch (error) {
    console.error("Error fetching promotions:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400
    });
  }
}

export const handle = withAuth(getPromotionsHandler);