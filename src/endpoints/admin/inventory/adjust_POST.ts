import { db } from "../../../helpers/db";
import { schema, type OutputType } from "./adjust_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';

function getLocationIdFromRequest(req: Request): number {
  const locationIdHeader = req.headers.get('X-Location-Id');
  if (!locationIdHeader) {
    throw new Error("X-Location-Id header is required.");
  }
  const locationId = parseInt(locationIdHeader, 10);
  if (isNaN(locationId) || locationId <= 0) {
    throw new Error("Invalid X-Location-Id header. Must be a positive integer.");
  }
  return locationId;
}

export async function handle(request: Request) {
  try {
    const locationId = getLocationIdFromRequest(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { productUuid, quantity, reason, lotId } = input;

    if (!lotId) {
      throw new Error("Lot ID is required for inventory adjustments.");
    }

    const movement = await db.transaction().execute(async (trx) => {
      // 1. Insert the stock movement record
      const newMovement = await trx
        .insertInto('stockMovements')
        .values({
          id: nanoid(),
          productUuid,
          qty: quantity.toString(), // Can be positive or negative
          type: 'ADJUSTMENT',
          locationId,
          lotId,
          reason,
          createdAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 2. Update the main product stock quantity
      await trx
        .updateTable('products')
        .set((eb) => ({
          stockQuantity: eb('stockQuantity', '+', quantity),
        }))
        .where('uuid', '=', productUuid)
        .execute();

      return newMovement;
    });

    return new Response(superjson.stringify(movement satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating inventory adjustment:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create adjustment: ${errorMessage}` }), { status: 400 });
  }
}