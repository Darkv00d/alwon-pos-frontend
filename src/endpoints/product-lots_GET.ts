import { db } from "../helpers/db";
import { schema, type OutputType } from "./product-lots_GET.schema";
import superjson from 'superjson';
import { type Selectable } from 'kysely';
import { type Products } from '../helpers/schema';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { productUuid } = schema.parse(queryParams);

    // First, fetch the main product lots data
    let query = db.selectFrom('productLots')
      .selectAll('productLots')
      .orderBy('productLots.expiresOn', 'asc');

    if (productUuid) {
      query = query.where('productLots.productUuid', '=', productUuid);
    }

    const lots = await query.execute();

    // Now fetch related product data for each lot
    const lotsWithProducts = await Promise.all(
      lots.map(async (lot) => {
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
          .where('uuid', '=', lot.productUuid)
          .executeTakeFirst();

        return {
          ...lot,
          product: product || null
        };
      })
    );

    return new Response(superjson.stringify(lotsWithProducts));
  } catch (error) {
    console.error("Error fetching product lots:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch product lots: ${errorMessage}` }), { status: 500 });
  }
}