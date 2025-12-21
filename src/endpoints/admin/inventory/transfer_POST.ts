import { db } from "../../../helpers/db";
import { schema, type OutputType } from "./transfer_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { productUuid, quantity, fromLocationId, toLocationId, reference, lotId } = input;

    if (!lotId) {
      throw new Error("Lot ID is required for inventory transfers.");
    }

    const transferReference = reference || `TRANS-${nanoid(10).toUpperCase()}`;

    const result = await db.transaction().execute(async (trx) => {
      // Check if fromLocationId and toLocationId exist
      const locations = await trx.selectFrom('locations')
        .where('id', 'in', [fromLocationId, toLocationId])
        .select('id')
        .execute();
      
      const locationIds = new Set(locations.map(l => l.id));
      if (!locationIds.has(fromLocationId)) {
        throw new Error(`Origin location with ID ${fromLocationId} not found.`);
      }
      if (!locationIds.has(toLocationId)) {
        throw new Error(`Destination location with ID ${toLocationId} not found.`);
      }

      // Check available stock in origin location
      const stockMovements = await trx.selectFrom('stockMovements')
        .where('productUuid', '=', productUuid)
        .where('locationId', '=', fromLocationId)
        .select('qty')
        .execute();

      const currentStock = stockMovements.reduce((total, movement) => {
        return total + parseFloat(movement.qty);
      }, 0);

      if (currentStock < quantity) {
        throw new Error(`Insufficient stock in origin location. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // 1. Create TRANSFER_OUT movement (negative quantity)
      const outMovement = await trx
        .insertInto('stockMovements')
        .values({
          id: randomUUID(),
          productUuid,
          qty: (-Math.abs(quantity)).toString(),
          type: 'TRANSFER',
          locationId: fromLocationId,
          lotId,
          ref: transferReference,
          createdAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 2. Create TRANSFER_IN movement (positive quantity)
      const inMovement = await trx
        .insertInto('stockMovements')
        .values({
          id: randomUUID(),
          productUuid,
          qty: Math.abs(quantity).toString(),
          type: 'TRANSFER',
          locationId: toLocationId,
          lotId,
          ref: transferReference,
          createdAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      
      // Note: Global product stock quantity is not updated as the net change is zero.
      // This operation only records the movement of stock between locations.

      return {
        message: "Inventory transferred successfully.",
        reference: transferReference,
        movements: [outMovement, inMovement],
      };
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating inventory transfer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create transfer: ${errorMessage}` }), { status: 400 });
  }
}