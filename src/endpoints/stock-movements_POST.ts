import { db } from "../helpers/db";
import { schema, type OutputType } from "./stock-movements_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { productUuid, qty, type, locationId, lotId, ref } = input;

    if (!lotId) {
      throw new Error("Lot ID is required for all stock movements.");
    }

    const movement = await db.transaction().execute(async (trx) => {
      // 1. Insert the stock movement record with positive/negative qty
      let finalQty = qty;
      
      // Apply positive/negative logic based on movement type
      switch (type) {
        case 'RECEIPT':
        case 'RETURN':
          finalQty = Math.abs(qty); // Ensure positive for incoming
          break;
        case 'SALE':
        case 'TRANSFER':
        case 'ADJUSTMENT':
          finalQty = -Math.abs(qty); // Ensure negative for outgoing
          break;
      }

      const newMovement = await trx
        .insertInto('stockMovements')
        .values({
          id: nanoid(),
          productUuid,
          qty: finalQty.toString(),
          type,
          locationId,
          lotId,
          ref,
          createdAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 2. Update the main product stock quantity
      await trx
        .updateTable('products')
        .set((eb) => ({
          stockQuantity: eb('stockQuantity', '+', finalQty),
        }))
        .where('uuid', '=', productUuid)
        .execute();

      return newMovement;
    });

    return new Response(superjson.stringify(movement satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create stock movement: ${errorMessage}` }), { status: 400 });
  }
}