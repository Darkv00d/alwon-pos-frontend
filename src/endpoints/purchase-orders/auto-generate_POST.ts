import { db } from "../../helpers/db";
import { type OutputType } from "./auto-generate_POST.schema";
import superjson from "superjson";
import {
  findLowStockProducts,
  groupProductsBySupplier,
  generatePoNumber,
} from "../../helpers/purchaseOrderLogic";
import { type Transaction } from "kysely";
import { type DB } from "../../helpers/schema";

async function autoGenerateInTransaction(trx: Transaction<DB>) {
  const lowStockProducts = await findLowStockProducts(trx);

  if (lowStockProducts.length === 0) {
    return [];
  }

  const productsBySupplier = groupProductsBySupplier(lowStockProducts);
  const createdPoIds: number[] = [];

  for (const [supplierId, products] of Object.entries(productsBySupplier)) {
    const productDetails = await trx
      .selectFrom("products")
      .select(["id", "price"])
      .where(
        "id",
        "in",
        products.map((p) => p.id)
      )
      .execute();

    const productPriceMap = new Map(
      productDetails.map((p) => [p.id, parseFloat(p.price)])
    );

    let totalAmount = 0;
    const poItemsToInsert = products.map((product) => {
      const unitPrice = productPriceMap.get(product.id);
      if (unitPrice === undefined) {
        throw new Error(`Price for product ID ${product.id} not found.`);
      }
      const itemTotal = unitPrice * product.suggestedQuantity;
      totalAmount += itemTotal;
      return {
        productId: product.id,
        quantity: product.suggestedQuantity,
        unitPrice: unitPrice.toString(),
        totalPrice: itemTotal.toString(),
      };
    });

    const poNumber = await generatePoNumber();

    const newPurchaseOrder = await trx
      .insertInto("purchaseOrders")
      .values({
        supplierId: parseInt(supplierId, 10),
        poNumber,
        status: "draft",
        totalAmount: totalAmount.toString(),
        createdAutomatically: true,
        notes: "Automatically generated based on low stock levels.",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    await trx
      .insertInto("purchaseOrderItems")
      .values(
        poItemsToInsert.map((item) => ({
          ...item,
          purchaseOrderId: newPurchaseOrder.id,
        }))
      )
      .execute();

    createdPoIds.push(newPurchaseOrder.id);
  }

  return createdPoIds;
}

export async function handle(request: Request) {
  try {
    const createdPoIds = await db.transaction().execute((trx) => {
      return autoGenerateInTransaction(trx);
    });

    return new Response(
      superjson.stringify({
        success: true,
        purchaseOrderIds: createdPoIds,
        count: createdPoIds.length,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to auto-generate purchase orders:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: `Failed to auto-generate purchase orders: ${errorMessage}`,
      }),
      { status: 500 }
    );
  }
}