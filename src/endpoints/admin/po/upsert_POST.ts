import { db } from "../../../helpers/db";
import { schema, type InputType, type OutputType } from "./upsert_POST.schema";
import { type Transaction } from "kysely";
import { type DB, type PurchaseOrderStatus } from "../../../helpers/schema";
import { verifyAdminToken } from "../../../helpers/auth";

async function createPurchaseOrderInTransaction(
  trx: Transaction<DB>,
  input: Omit<InputType, "purchaseOrderId">
) {
  const { supplierId, items, ...poData } = input;

  // Validate that supplierId exists (required for creation)
  if (!supplierId) {
    throw new Error("supplierId is required when creating a new purchase order");
  }

  const supplier = await trx
    .selectFrom("suppliers")
    .select(["leadTimeDays"])
    .where("id", "=", supplierId)
    .executeTakeFirstOrThrow();

  // Validate that items exist (required for creation)
  if (!items || items.length === 0) {
    throw new Error("items are required when creating a new purchase order");
  }

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
    };
  });

  const total = subtotal + totalTax;

  let expectedDate = poData.expectedDate;
  if (!expectedDate && supplier.leadTimeDays) {
    const newExpectedDate = new Date();
    newExpectedDate.setDate(newExpectedDate.getDate() + supplier.leadTimeDays);
    expectedDate = newExpectedDate;
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

async function updatePurchaseOrderInTransaction(
  trx: Transaction<DB>,
  input: InputType & { purchaseOrderId: number }
) {
  const { purchaseOrderId, items, notes, expectedDate, status, supplierId } =
    input;

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

  // Base update object
  const updateData: {
    notes?: string | null;
    expectedDate?: Date | null;
    status?: PurchaseOrderStatus;
    supplierId?: number;
    subtotal?: string;
    tax?: string;
    total?: string;
  } = {};

  if (notes !== undefined) updateData.notes = notes;
  if (expectedDate !== undefined) updateData.expectedDate = expectedDate;
  if (status !== undefined) updateData.status = status;
  if (supplierId !== undefined) updateData.supplierId = supplierId;

  // Handle items update and recalculate totals if items are provided
  if (items && items.length > 0) {
    await trx
      .deleteFrom("purchaseOrderItems")
      .where("poId", "=", purchaseOrderId)
      .execute();

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

    await trx
      .insertInto("purchaseOrderItems")
      .values(poItemsToInsert)
      .execute();

    updateData.subtotal = subtotal.toString();
    updateData.tax = totalTax.toString();
    updateData.total = (subtotal + totalTax).toString();
  }

  const result = await trx
    .updateTable("purchaseOrders")
    .set(updateData)
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
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const json = await request.json();
    const input = schema.parse(json);

    const purchaseOrderId = await db.transaction().execute(async (trx) => {
      if (input.purchaseOrderId) {
        return updatePurchaseOrderInTransaction(
          trx,
          input as InputType & { purchaseOrderId: number }
        );
      } else {
        return createPurchaseOrderInTransaction(trx, input);
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchaseOrderId,
      } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to upsert purchase order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({
        error: `Failed to upsert purchase order: ${errorMessage}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}