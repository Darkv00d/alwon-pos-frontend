import { db } from "../../../helpers/db";
import { type OutputType, type PurchaseOrderDetails } from "./list_GET.schema";
import { jsonObjectFrom, jsonArrayFrom } from "kysely/helpers/postgres";
import { sql } from "kysely";
import { verifyAdminToken } from "../../../helpers/auth";

export async function handle(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q");

    let query = db
      .selectFrom("purchaseOrders")
      .selectAll("purchaseOrders")
      .select((eb) => [
        jsonObjectFrom(
          eb
            .selectFrom("suppliers")
            .selectAll()
            .whereRef("suppliers.id", "=", "purchaseOrders.supplierId")
        ).as("supplier"),
        eb.fn.coalesce(
          jsonArrayFrom(
            eb
              .selectFrom("purchaseOrderItems")
              .selectAll("purchaseOrderItems")
              .select((itemEb) => [
                jsonObjectFrom(
                  itemEb
                    .selectFrom("products")
                    .selectAll()
                    .whereRef("products.id", "=", "purchaseOrderItems.productId")
                ).as("product"),
              ])
              .whereRef("purchaseOrderItems.poId", "=", "purchaseOrders.id")
          ),
          sql`'[]'::json`
        ).as("items"),
      ]);

    if (searchQuery) {
      query = query.where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom("suppliers")
              .whereRef("suppliers.id", "=", "purchaseOrders.supplierId")
              .where("suppliers.name", "ilike", `%${searchQuery}%`)
          ),
          sql<boolean>`"purchaseOrders"."id"::text ilike ${`%${searchQuery}%`}`,
          sql<boolean>`"purchaseOrders"."status" ilike ${`%${searchQuery}%`}`,
        ])
      );
    }

    const purchaseOrders = await query
      .orderBy("purchaseOrders.createdAt", "desc")
      .execute() as PurchaseOrderDetails[];



    return new Response(
      JSON.stringify({ purchaseOrders } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to fetch purchase orders for admin:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({
        error: `Failed to fetch purchase orders: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}