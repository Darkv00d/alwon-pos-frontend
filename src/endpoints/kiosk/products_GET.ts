import { db } from "../../helpers/db";
import { OutputType } from "./products_GET.schema";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../../helpers/schema";

// Interface for the flat database result before transformation
interface ProductRowWithFlatSupplier extends Selectable<Products> {
  supplierName: string | null;
  supplierContactPerson: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  supplierAddress: string | null;
  supplierNotes: string | null;
  supplierCreatedAt: Date | null;
  supplierUpdatedAt: Date | null;
}

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q');
    
    const locationIdHeader = request.headers.get('X-Location-Id');
    let locationId: number | null = null;
    if (locationIdHeader) {
      const parsedLocationId = parseInt(locationIdHeader, 10);
      if (isNaN(parsedLocationId) || parsedLocationId <= 0) {
        return new Response(superjson.stringify({ error: "Invalid X-Location-Id header provided." }), { status: 400 });
      }
      locationId = parsedLocationId;
    }

    console.log(`Public kiosk requesting products. Location ID: ${locationId ?? 'all'}`);

    let query = db
      .selectFrom('products')
      .leftJoin('suppliers', 'products.supplierId', 'suppliers.id')
      .where('products.stockQuantity', '>', 0) // Only return products with stock
      .selectAll('products')
      .select([
        'suppliers.id as supplierId',
        'suppliers.name as supplierName',
        'suppliers.contactPerson as supplierContactPerson',
        'suppliers.phone as supplierPhone',
        'suppliers.email as supplierEmail',
        'suppliers.address as supplierAddress',
        'suppliers.notes as supplierNotes',
        'suppliers.createdAt as supplierCreatedAt',
        'suppliers.updatedAt as supplierUpdatedAt'
      ]);

    // Location ID header is accepted for future multi-location support but not used for filtering yet
    // For now, return all available products regardless of location

    // Add search functionality if query parameter is provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query = query.where((eb) =>
        eb.or([
          eb('products.name', 'ilike', searchTerm),
          eb('products.barcode', 'ilike', searchTerm)
        ])
      );
    }

    const productsWithSuppliers = await query
      .orderBy('products.name', 'asc')
      .execute();

    // Transform the flat result into nested structure
    const products = productsWithSuppliers.map((row: ProductRowWithFlatSupplier) => {
      const {
        supplierName,
        supplierContactPerson,
        supplierPhone,
        supplierEmail,
        supplierAddress,
        supplierNotes,
        supplierCreatedAt,
        supplierUpdatedAt,
        ...product
      } = row;

      const supplier = row.supplierId ? {
        id: row.supplierId,
        name: supplierName!,
        contactPerson: supplierContactPerson,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
        notes: supplierNotes,
        createdAt: supplierCreatedAt!,
        updatedAt: supplierUpdatedAt!,
        uuid: null
      } as Selectable<Suppliers> : null;

      return {
        ...product,
        supplier
      };
    });
    
    console.log(`Returning ${products.length} products for public kiosk request${searchQuery ? ` (search: "${searchQuery}")` : ''}.`);
    
    return new Response(superjson.stringify(products satisfies OutputType));
  } catch (error) {
    console.error("Error fetching kiosk products:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch kiosk products: ${errorMessage}` }), { status: 500 });
  }
}