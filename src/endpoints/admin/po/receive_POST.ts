import { db } from "../../../helpers/db";
import { schema, type InputType, type OutputType } from "./receive_POST.schema";
import { type Transaction } from "kysely";
import { type DB } from "../../../helpers/schema";
import { verifyAdminToken } from "../../../helpers/auth";
import { nanoid } from "nanoid";

function getLocationIdFromHeader(req: Request): number | undefined {
  const locationIdHeader = req.headers.get("x-location-id");
  if (locationIdHeader) {
    const id = parseInt(locationIdHeader, 10);
    return isNaN(id) ? undefined : id;
  }
  return undefined;
}

async function receivePurchaseOrderInTransaction(
  trx: Transaction<DB>,
  input: InputType,
  locationId: number | undefined
) {
  const { id: purchaseOrderId } = input;

  if (!locationId) {
    throw new Error("x-location-id header is required to receive a purchase order.");
  }

  const currentPo = await trx
    .selectFrom("purchaseOrders")
    .select(["status"])
    .where("id", "=", purchaseOrderId)
    .executeTakeFirstOrThrow();

  if (currentPo.status === "received") {
    throw new Error("This purchase order has already been received.");
  }
  if (currentPo.status === "cancelled") {
    throw new Error("Cannot receive a cancelled purchase order.");
  }
  if (currentPo.status === "draft") {
    throw new Error("Cannot receive a draft purchase order. It must be sent first.");
  }

  const items = await trx
    .selectFrom("purchaseOrderItems")
    .innerJoin("products", "products.id", "purchaseOrderItems.productId")
    .select(["purchaseOrderItems.productId", "purchaseOrderItems.qty", "products.uuid"])
    .where("poId", "=", purchaseOrderId)
    .execute();

  if (items.length === 0) {
    throw new Error("Cannot receive a purchase order with no items.");
  }

  for (const item of items) {
    if (!item.uuid) {
      console.warn(`Product with ID ${item.productId} is missing a UUID. Skipping stock movement.`);
      continue;
    }
    
    // Create a lot for this PO receipt
    const lotCode = `PO-${purchaseOrderId}-${item.productId}`;
    
    // Check if lot already exists
    let lotId: string;
    const existingLot = await trx
      .selectFrom("productLots")
      .where("productUuid", "=", item.uuid)
      .where("lotCode", "=", lotCode)
      .select("id")
      .executeTakeFirst();

    if (existingLot) {
      lotId = existingLot.id;
    } else {
      // Create new lot for this PO receipt
      lotId = nanoid();
      await trx
        .insertInto("productLots")
        .values({
          id: lotId,
          productUuid: item.uuid,
          lotCode: lotCode,
          expiresOn: null, // PO receipts don't have expiration date by default
        })
        .execute();
    }
    
    // Create stock movement record with lot
    await trx
      .insertInto("stockMovements")
      .values({
        id: nanoid(),
        productUuid: item.uuid,
        locationId: locationId,
        type: "RECEIPT",
        qty: item.qty.toString(),
        ref: `po:${purchaseOrderId}`,
        lotId: lotId, // Now always has a value
        createdAt: new Date(),
      })
      .execute();

    // Update product stock quantity
    await trx
      .updateTable("products")
      .set((eb) => ({ stockQuantity: eb("stockQuantity", "+", item.qty) }))
      .where("id", "=", item.productId)
      .execute();
  }

  const result = await trx
    .updateTable("purchaseOrders")
    .set({
      status: "received",
      locationId: locationId,
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
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const locationId = getLocationIdFromHeader(request);
    const json = await request.json();
    const input = schema.parse(json);

    const updatedId = await db.transaction().execute((trx) => {
      return receivePurchaseOrderInTransaction(trx, input, locationId);
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchaseOrderId: updatedId,
      } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to receive purchase order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({
        error: `Failed to receive purchase order: ${errorMessage}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}