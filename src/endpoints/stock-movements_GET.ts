import { db } from "../helpers/db";
import { schema, type OutputType } from "./stock-movements_GET.schema";
import superjson from 'superjson';
import { type Selectable } from 'kysely';
import { type Products, type Locations, type ProductLots } from '../helpers/schema';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { productUuid, locationId, lotId, type } = schema.parse(queryParams);

    // First, fetch the main stock movements data
    let query = db.selectFrom('stockMovements')
      .selectAll('stockMovements')
      .orderBy('stockMovements.createdAt', 'desc');

    if (productUuid) {
      query = query.where('stockMovements.productUuid', '=', productUuid);
    }
    if (locationId) {
      query = query.where('stockMovements.locationId', '=', locationId);
    }
    if (lotId) {
      query = query.where('stockMovements.lotId', '=', lotId);
    }
    if (type) {
      query = query.where('stockMovements.type', '=', type);
    }

    const movements = await query.execute();

    // Now fetch related data for each movement
    const movementsWithDetails = await Promise.all(
      movements.map(async (movement) => {
        // Fetch product data
        const product = await db.selectFrom('products')
          .select([
            'id',
            'uuid',
            'name',
            'category',
            'description',
            'price',
            'stockQuantity',
            'minimumStock',
            'barcode',
            'supplierId',
            'createdAt',
            'updatedAt'
          ])
          .where('uuid', '=', movement.productUuid)
          .executeTakeFirst();

        // Fetch location data if locationId exists
        let location: Selectable<Locations> | null = null;
        if (movement.locationId) {
          location = await db.selectFrom('locations')
            .select([
              'id',
              'name',
              'code',
              'createdAt',
              'updatedAt'
            ])
            .where('id', '=', movement.locationId)
            .executeTakeFirst() || null;
        }

        // Fetch lot data if lotId exists
        let lot: Selectable<ProductLots> | null = null;
        if (movement.lotId) {
          lot = await db.selectFrom('productLots')
            .select([
              'id',
              'productUuid',
              'expiresOn',
              'lotCode'
            ])
            .where('id', '=', movement.lotId)
            .executeTakeFirst() || null;
        }

        return {
          ...movement,
          product: product || null,
          location,
          lot
        };
      })
    );

    return new Response(superjson.stringify(movementsWithDetails));
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch stock movements: ${errorMessage}` }), { status: 500 });
  }
}