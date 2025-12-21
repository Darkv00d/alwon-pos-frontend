import { db } from "../helpers/db";
import { type OutputType, type PurchaseOrderDetails } from "./purchase-orders_GET.schema";
import superjson from "superjson";
import { jsonObjectFrom, jsonArrayFrom } from "kysely/helpers/postgres";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const purchaseOrders = await db
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
      ])
      .orderBy("purchaseOrders.createdAt", "desc")
      .execute() as PurchaseOrderDetails[];

    return new Response(
      superjson.stringify({ purchaseOrders } as OutputType)
    );
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to fetch purchase orders: ${errorMessage}` }),
      { status: 500 }
    );
  }
}