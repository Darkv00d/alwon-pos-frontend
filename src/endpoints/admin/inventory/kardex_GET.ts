import { db } from "../../../helpers/db";
import { schema, type OutputType } from "./kardex_GET.schema";
import superjson from 'superjson';


export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { productUuid, locationId, from, to } = schema.parse(queryParams);

    let query = db.selectFrom('stockMovements')
      .leftJoin('products', 'products.uuid', 'stockMovements.productUuid')
      .leftJoin('locations', 'locations.id', 'stockMovements.locationId')
      .leftJoin('productLots', 'productLots.id', 'stockMovements.lotId')
      .select([
        'stockMovements.id',
        'stockMovements.createdAt',
        'stockMovements.type',
        'stockMovements.qty',
        'stockMovements.ref',
        'stockMovements.reason',
        'products.uuid as productUuid',
        'products.name as productName',
        'products.barcode as productBarcode',
        'locations.id as locationId',
        'locations.name as locationName',
        'productLots.id as lotId',
        'productLots.lotCode as lotCode',
        'productLots.expiresOn as lotExpiresOn',
      ])
      .orderBy('stockMovements.createdAt', 'desc');

    if (productUuid) {
      query = query.where('stockMovements.productUuid', '=', productUuid);
    }
    if (locationId) {
      query = query.where('stockMovements.locationId', '=', locationId);
    }
    if (from || to) {
      query = query.where((eb) => {
        const conditions = [];
        if (from) {
          conditions.push(eb('stockMovements.createdAt', '>=', from));
        }
        if (to) {
          conditions.push(eb('stockMovements.createdAt', '<=', to));
        }
        return eb.and(conditions);
      });
    }

    const movements = await query.execute();

    return new Response(superjson.stringify(movements satisfies OutputType));
  } catch (error) {
    console.error("Error fetching inventory kardex:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch kardex: ${errorMessage}` }), { status: 500 });
  }
}