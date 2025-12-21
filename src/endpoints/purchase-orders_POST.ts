import { db } from "../helpers/db";
import { schema, type OutputType } from "./purchase-orders_POST.schema";
import superjson from "superjson";
import { type Transaction } from "kysely";
import { type DB } from "../helpers/schema";


async function createPurchaseOrderInTransaction(
  trx: Transaction<DB>,
  input: Zod.infer<typeof schema>
) {
  const { supplierId, items, ...poData } = input;

  // Fetch supplier to get leadTimeDays for expectedDate calculation
  const supplier = await trx
    .selectFrom("suppliers")
    .select(["leadTimeDays"])
    .where("id", "=", supplierId)
    .executeTakeFirstOrThrow();

  const products = await trx
    .selectFrom("products")
    .select(["id", "price"])
    .where(
      "id",
      "in",
      items.map((item) => item.productId)
    )
    .execute();

  const productPriceMap = new Map(
    products.map((p) => [p.id, parseFloat(p.price)])
  );

  let totalAmount = 0;
  let subtotal = 0;
  let totalTax = 0;
  
  const poItemsToInsert = items.map((item) => {
    const unitPrice = productPriceMap.get(item.productId);
    if (unitPrice === undefined) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    const taxRate = item.taxRate || 0;
    const itemSubtotal = unitPrice * item.qty;
    const itemTax = itemSubtotal * (taxRate / 100);
    
    subtotal += itemSubtotal;
    totalTax += itemTax;
    
    return {
      productId: item.productId,
      qty: item.qty,
      unitPrice: unitPrice.toString(),
      taxRate: taxRate.toString(),
    };
  });

  const total = subtotal + totalTax;

  // Calculate expectedDate if not provided and supplier has leadTimeDays
  let expectedDate = poData.expectedDate;
  if (!expectedDate && supplier.leadTimeDays) {
    expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + supplier.leadTimeDays);
  }

  const newPurchaseOrder = await trx
    .insertInto("purchaseOrders")
    .values({
      ...poData,
      supplierId,
      expectedDate,
      subtotal: subtotal.toString(),
      tax: totalTax.toString(),
      total: total.toString(),
      status: poData.status ?? "draft",
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await trx
    .insertInto("purchaseOrderItems")
    .values(
      poItemsToInsert.map((item) => ({
        ...item,
        poId: newPurchaseOrder.id,
      }))
    )
    .execute();

  return newPurchaseOrder.id;
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newPurchaseOrderId = await db.transaction().execute((trx) => {
      return createPurchaseOrderInTransaction(trx, input);
    });

    return new Response(
      superjson.stringify({
        success: true,
        purchaseOrderId: newPurchaseOrderId,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to create purchase order: ${errorMessage}` }),
      { status: 400 }
    );
  }
}