import { db } from "../../../helpers/db";
import { schema, OutputType } from "./recompute_POST.schema";
import { verifyAdminToken } from "../../../helpers/auth";
import superjson from "superjson";
import { sql } from "kysely";
import { subDays } from "date-fns";

export async function handle(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const locationIdsHeader = request.headers.get("X-Location-Ids");
    const locationIds = locationIdsHeader
      ? locationIdsHeader.split(",").map((id) => parseInt(id.trim(), 10)).filter(Number.isInteger)
      : [];

    if (locationIds.length === 0) {
      return new Response(
        superjson.stringify({ error: "X-Location-Ids header is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body with robust error handling
    let json = {};
    try {
      const bodyText = await request.text();
      if (bodyText.trim()) {
        json = JSON.parse(bodyText);
      }
    } catch (error) {
      return new Response(
        superjson.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { daysWindow = 30 } = schema.parse(json);
    const startDate = subDays(new Date(), daysWindow);

    const result = await db.transaction().execute(async (trx) => {
      // Step 1: Get all active locations filtered by X-Location-Ids
      const locations = await trx
        .selectFrom("locations")
        .select(["id"])
        .where("id", "in", locationIds)
        .where("isActive", "=", true)
        .execute();

      if (locations.length === 0) {
        return { created: 0, updated: 0, dismissed: 0 };
      }

      const activeLocationIds = locations.map(l => l.id);

      // Step 2: Get all active products with reorderEnabled
      const products = await trx
        .selectFrom("products as p")
        .select([
          "p.id as productId",
          "p.preferredSupplierId",
          "p.daysofcovertarget",
        ])
        .where("p.isActive", "=", true)
        .where("p.reorderenabled", "=", true)
        .execute();

      if (products.length === 0) {
        return { created: 0, updated: 0, dismissed: 0 };
      }

      const productIds = products.map(p => p.productId);

      // Step 3: Get supplier lead times for products
      const supplierIds = products.map(p => p.preferredSupplierId).filter(Boolean);
      const supplierData = supplierIds.length > 0 
        ? await trx
            .selectFrom("suppliers")
            .select(["id", "leadTimeDays"])
            .where("id", "in", supplierIds)
            .execute()
        : [];
      const supplierMap = new Map(supplierData.map(s => [s.id, s.leadTimeDays ?? 7]));

      // Step 4: Get product location parameters
      const locationParams = activeLocationIds.length > 0 && productIds.length > 0
        ? await trx
            .selectFrom("productlocationparams")
            .select([
              "productid",
              "locationid", 
              "safetystock",
              "daysofcovertarget"
            ])
            .where("locationid", "in", activeLocationIds)
            .where("productid", "in", productIds)
            .execute()
        : [];
      const paramsMap = new Map(locationParams.map(p => 
        [`${p.productid}-${p.locationid}`, p]
      ));

      // Step 5: Get current stock for all product-location combinations
      const stockData = activeLocationIds.length > 0 && productIds.length > 0
        ? await trx
            .selectFrom("stockMovements")
            .select([
              "productId",
              "locationId",
              sql<number>`SUM(qty)`.as("currentStock"),
            ])
            .where("locationId", "in", activeLocationIds)
            .where("productId", "in", productIds)
            .groupBy(["productId", "locationId"])
            .execute()
        : [];
      const stockMap = new Map(stockData.map(s => 
        [`${s.productId}-${s.locationId}`, s.currentStock]
      ));

      // Step 6: Get sales data for demand calculation
      const salesData = activeLocationIds.length > 0 && productIds.length > 0
        ? await trx
            .selectFrom("stockMovements")
            .select([
              "productId",
              "locationId",
              sql<number>`SUM(ABS(qty))`.as("totalSold"),
            ])
            .where("type", "=", "SALE")
            .where("createdAt", ">=", startDate)
            .where("locationId", "in", activeLocationIds)
            .where("productId", "in", productIds)
            .groupBy(["productId", "locationId"])
            .execute()
        : [];
      const demandMap = new Map(salesData.map(s => 
        [`${s.productId}-${s.locationId}`, s.totalSold / daysWindow]
      ));

      // Step 7: Mark all previous 'open' suggestions as 'dismissed' for re-evaluation
      const { numUpdatedRows } = await trx
        .updateTable("reordersuggestions")
        .set({ status: "dismissed" })
        .where("locationid", "in", activeLocationIds)
        .where("status", "=", "open")
        .executeTakeFirst();
      const dismissedCount = Number(numUpdatedRows);

      // Step 8: Calculate and insert new suggestions for each product-location combination
      const suggestionsToInsert = [];
      
      for (const product of products) {
        for (const location of locations) {
          const key = `${product.productId}-${location.id}`;
          const currentStock = stockMap.get(key) ?? 0;
          const demandDaily = demandMap.get(key) ?? 0;
          
          // Get parameters with fallbacks
          const params = paramsMap.get(key);
          const safetyStock = params?.safetystock ? Number(params.safetystock) : 0;
          const daysOfCoverTarget = params?.daysofcovertarget ?? product.daysofcovertarget ?? 14;
          const leadTimeDays = product.preferredSupplierId 
            ? supplierMap.get(product.preferredSupplierId) ?? 7
            : 7;

          // Calculate ROP and target stock
          const rop = demandDaily * leadTimeDays + safetyStock;
          const targetStock = Math.max(
            demandDaily * daysOfCoverTarget,
            rop * 1.1
          );
          const suggestedQty = Math.max(0, targetStock - currentStock);

          if (suggestedQty > 0) {
            suggestionsToInsert.push({
              productid: product.productId,
              locationid: location.id,
              supplierid: product.preferredSupplierId,
              currentstock: currentStock.toString(),
              demanddaily: demandDaily.toString(),
              leadtimedays: leadTimeDays,
              safetystock: safetyStock.toString(),
              rop: rop.toString(),
              targetstock: targetStock.toString(),
              suggestedqty: suggestedQty.toString(),
              status: "open" as const,
            });
          }
        }
      }

      if (suggestionsToInsert.length > 0) {
        await trx.insertInto("reordersuggestions").values(suggestionsToInsert).execute();
      }

      return {
        created: suggestionsToInsert.length,
        updated: 0, // Logic for updating is not required by spec, we dismiss and create
        dismissed: dismissedCount,
      };
    });

    return new Response(superjson.stringify(result satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to recompute reorder suggestions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: `Failed to recompute suggestions: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}