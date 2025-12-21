import { db } from "../../helpers/db";
import { schema, OutputType, ReceivedItemSchema } from "./receive_POST.schema";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB } from "../../helpers/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

function getWriteLocFromReq(req: Request): number | undefined {
  const v = req.headers.get('x-location-id');
  return v ? Number(v) : undefined;
}

type ReceivedItemInput = z.infer<typeof ReceivedItemSchema>;

async function processInventoryReceipt(
  trx: Transaction<DB>,
  items: ReceivedItemInput[],
  reference?: string,
  notes?: string,
  locationId?: number
) {
  const productUuids = items.map(item => item.productUuid);
  const products = await trx.selectFrom('products')
    .where('uuid', 'in', productUuids)
    .selectAll()
    .execute();

  if (products.length !== productUuids.length) {
    const foundUuids = new Set(products.map(p => p.uuid));
    const notFoundUuids = productUuids.filter(uuid => !foundUuids.has(uuid));
    throw new Error(`The following product UUIDs were not found: ${notFoundUuids.join(', ')}.`);
  }

  const createdStockMovements = [];

  for (const item of items) {
    // 1. Update Product Stock Quantity
    await trx.updateTable('products')
      .set(eb => ({
        stockQuantity: eb('stockQuantity', '+', item.quantity)
      }))
      .where('uuid', '=', item.productUuid)
      .execute();

    let lotId: string;

    // 2. Handle Lot Tracking - create lot if not provided
    const lotCode = item.lotCode || `RCV-${nanoid(10)}`;
    
    const existingLot = await trx.selectFrom('productLots')
      .where('productUuid', '=', item.productUuid)
      .where('lotCode', '=', lotCode)
      .selectAll()
      .executeTakeFirst();

    if (existingLot) {
      // Use existing lot
      lotId = existingLot.id;
      // Update expiration date if a new one is provided
      if (item.expiresOn) {
        await trx.updateTable('productLots')
          .set({ expiresOn: item.expiresOn })
          .where('id', '=', lotId)
          .execute();
      }
    } else {
      // Create new lot (either with user-provided code or auto-generated)
      lotId = nanoid();
      await trx.insertInto('productLots')
        .values({
          id: lotId,
          productUuid: item.productUuid,
          lotCode: lotCode,
          expiresOn: item.expiresOn,
        })
        .execute();
    }

    // 3. Record Stock Movement with positive qty for receipts
    const movement = await trx.insertInto('stockMovements')
      .values({
        id: nanoid(),
        productUuid: item.productUuid,
        qty: item.quantity.toString(), // Positive for incoming inventory
        type: 'RECEIPT',
        ref: reference,
        locationId: locationId,
        lotId: lotId, // Now always has a value
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    createdStockMovements.push(movement);
  }

  return {
    message: "Inventory received successfully.",
    stockMovements: createdStockMovements,
  };
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { items, reference, notes } = schema.parse(json);
    const writeLocId = getWriteLocFromReq(request);

    const result = await db.transaction().execute(async (trx) => {
      return processInventoryReceipt(trx, items, reference, notes, writeLocId);
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error receiving inventory:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to receive inventory: ${errorMessage}` }), { status: 400 });
  }
}