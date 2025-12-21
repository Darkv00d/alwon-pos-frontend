import { db } from "../../helpers/db";
import { OutputType, ProductWithStockAndSupplier } from "./by-barcode_GET.schema";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../../helpers/schema";
import { jsonObjectFrom } from 'kysely/helpers/postgres';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const barcode = url.searchParams.get('barcode');
    const locationIdStr = url.searchParams.get('locationId');

    if (!barcode || barcode.trim() === '') {
      return new Response(superjson.stringify({ error: "Barcode parameter is required." }), { status: 400 });
    }

    let locationId: number | null = null;
    if (locationIdStr) {
      const parsedLocationId = parseInt(locationIdStr, 10);
      if (isNaN(parsedLocationId) || parsedLocationId <= 0) {
        return new Response(superjson.stringify({ error: "Invalid locationId parameter provided." }), { status: 400 });
      }
      locationId = parsedLocationId;
    }

    console.log(`Searching for product with barcode: "${barcode}"`, locationId ? `at locationId: ${locationId}` : '');

    const query = db
      .selectFrom('products')
      .where('products.barcode', 'ilike', barcode.trim())
      .where('products.isActive', '=', true)
      .selectAll('products')
      .select((eb) => [
        jsonObjectFrom(
          eb.selectFrom('suppliers')
            .whereRef('suppliers.id', '=', 'products.supplierId')
            .selectAll()
        ).as('supplier')
      ]);

    // Note: locationId is accepted but not used for filtering
    // Stock quantity is returned from products.stockQuantity field
    // Location-based stock calculation can be handled at the application level if needed

    const product = await query.executeTakeFirst();

    if (!product) {
      console.log(`Product with barcode "${barcode}" not found.`);
      return new Response(superjson.stringify({ error: "Product not found." }), { status: 404 });
    }

    // Ensure stockQuantity is a number for consistency in the output type.
    const productWithParsedStock: ProductWithStockAndSupplier = {
      ...product,
      stockQuantity: Number(product.stockQuantity),
      supplier: product.supplier as Selectable<Suppliers> | null,
    };

    console.log(`Found product: ${product.name} (ID: ${product.id})`);
    return new Response(superjson.stringify(productWithParsedStock satisfies OutputType));

  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch product: ${errorMessage}` }), { status: 500 });
  }
}