import { db } from "../../helpers/db";
import { schema, type InputType, type OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { type Transaction } from "kysely";
import { type DB, type PurchaseOrderStatus } from "../../helpers/schema";

function getWriteLocFromReq(req: Request): number | undefined {
  const v = req.headers.get('x-location-id');
  return v ? Number(v) : undefined;
}

async function updatePurchaseOrderInTransaction(
  trx: Transaction<DB>,
  input: InputType,
  writeLocId: number | undefined
) {
  const { purchaseOrderId, status, items, notes, expectedDate } = input;
  
  // Build update object with proper typing
  let updateData: {
    expectedDate?: Date | null;
    notes?: string | null;
    subtotal?: string;
    tax?: string;
    total?: string;
  } = {};
  
  if (notes !== undefined) updateData.notes = notes;
  if (expectedDate !== undefined) updateData.expectedDate = expectedDate;

  const currentPo = await trx
    .selectFrom("purchaseOrders")
    .select(["status"])
    .where("id", "=", purchaseOrderId)
    .executeTakeFirstOrThrow();

  if (currentPo.status === "received" || currentPo.status === "cancelled") {
    throw new Error(
      `Cannot update a purchase order that is already ${currentPo.status}.`
    );
  }

  // Handle items update and recalculate totals if items are provided
  if (items && items.length > 0) {
    // Delete existing items
    await trx
      .deleteFrom("purchaseOrderItems")
      .where("poId", "=", purchaseOrderId)
      .execute();

    // Get product prices for calculation
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
        poId: purchaseOrderId,
      };
    });

    const total = subtotal + totalTax;

    // Insert new items
    await trx
      .insertInto("purchaseOrderItems")
      .values(poItemsToInsert)
      .execute();

    // Update PO with new totals
    updateData.subtotal = subtotal.toString();
    updateData.tax = totalTax.toString();
    updateData.total = total.toString();
  }

  if (status === "received") {
    const currentItems = await trx
      .selectFrom("purchaseOrderItems")
      .select(["productId", "qty"])
      .where("poId", "=", purchaseOrderId)
      .execute();

    if (currentItems.length === 0) {
      throw new Error("Cannot receive a purchase order with no items.");
    }

    for (const item of currentItems) {
      // Get product UUID and insert stock movement
      const prod = await trx.selectFrom("products").select(["uuid"]).where("id","=",item.productId).executeTakeFirst();
      if (prod?.uuid) {
        await trx.insertInto("stockMovements").values({
          productUuid: prod.uuid,
          lotId: null,
          locationId: writeLocId,
          type: "RECEIPT",
          qty: item.qty.toString(),
          ref: `po:${purchaseOrderId}`,
          createdAt: new Date()
        }).execute();
      }

      // Legacy compatibility - maintain products.stockQuantity
      await trx
        .updateTable("products")
        .set((eb) => ({ stockQuantity: eb("stockQuantity", "+", item.qty) }))
        .where("id", "=", item.productId)
        .execute();
    }
  }

    const result = await trx
    .updateTable("purchaseOrders")
    .set({ 
      ...updateData, 
      status,
      locationId: status === "received" ? writeLocId : undefined
    })
    .where("id", "=", purchaseOrderId)
    .returning("id")
    .executeTakeFirst();

  if (!result) {
    throw new Error(`Purchase order with ID ${purchaseOrderId} not found.`);
  }

  return result.id;
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const writeLocId = getWriteLocFromReq(request);

    const updatedId = await db.transaction().execute((trx) => {
      return updatePurchaseOrderInTransaction(trx, input, writeLocId);
    });

    return new Response(
      superjson.stringify({
        success: true,
        purchaseOrderId: updatedId,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to update purchase order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to update purchase order: ${errorMessage}` }),
      { status: 400 }
    );
  }
}