import superjson from "superjson";
import { db } from "../../../helpers/db";
import { withAuth } from "../../../helpers/withAuth";
import { schema, OutputType } from "./top_products_GET.schema";
import { sql } from "kysely";

export const handle = withAuth(async (req: Request, user) => {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Unauthorized: Admin access required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const input = schema.parse({
      from: req.headers.get("X-Date-From"),
      to: req.headers.get("X-Date-To"),
      locationIds: req.headers.get("X-Location-Ids"),
    });

    const { from, to, locationIds } = input;

    let query = db
      .selectFrom("transactionItems")
      .innerJoin(
        "products",
        "products.id",
        "transactionItems.productId"
      )
      .innerJoin(
        "transactions",
        "transactions.id",
        "transactionItems.transactionId"
      )
      .select([
        "products.name",
        // Calculate revenue: SUM(quantity * unit_price)
        // Cast to numeric to ensure precision
        sql<string>`SUM(transaction_items.quantity * transaction_items.unit_price)`.as("revenue"),
      ])
      .groupBy("products.id") // Group by product ID for accuracy
      .orderBy("revenue", "desc")
      .limit(10);

    if (from) {
      query = query.where("transactions.createdAt", ">=", from);
    }
    if (to) {
      const toDate = new Date(to);
      // Use end of day to make the range inclusive
      toDate.setHours(23, 59, 59, 999);
      query = query.where("transactions.createdAt", "<=", toDate);
    }

    if (locationIds && locationIds.length > 0) {
      query = query.where("transactions.locationId", "in", locationIds);
    }

    const topProducts = await query.execute();

    const response: OutputType = {
      ok: true,
      items: topProducts.map(item => ({
        name: item.name,
        revenue: String(item.revenue ?? "0")
      })),
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching top products report:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});