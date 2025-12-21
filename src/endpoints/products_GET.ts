import { db } from "../helpers/db";
import { OutputType } from "./products_GET.schema";
import { LocationContext } from "../helpers/locationContext";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../helpers/schema";

// Interface for the flat database result before transformation
interface ProductRowWithFlatSupplier extends Selectable<Products> {
  supplierId: number | null;
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
    // Parse location context from request
    const locationContext = await LocationContext.fromRequest(request);
    
    // Validate that the user has read access to the requested locations
    locationContext.validateLocationAccess('read');
    
    // Get the location IDs to filter by
    const locationIds = locationContext.getLocationIds();
    const accessibleLocationIds = locationContext.getAccessibleLocationIds();
    
    console.log(`User requesting products. Location IDs: ${locationIds ? locationIds.join(', ') : 'all accessible'}, Accessible: ${accessibleLocationIds.join(', ')}`);
    
    // Build the base query for products with suppliers
    let query = db
      .selectFrom('products')
      .leftJoin('suppliers', 'products.supplierId', 'suppliers.id')
      .select([
        'products.id',
        'products.name',
        'products.price',
        'products.stockQuantity',
        'products.minimumStock',
        'products.barcode',
        'products.category',
        'products.description',
        'products.imageurl',
        'products.supplierId',
        'products.createdAt',
        'products.updatedAt',
        'products.uuid'
      ])
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

    // Handle location filtering - since products don't have direct location association,
    // we'll filter by products that have stock movements in accessible locations
    if (locationIds !== null) {
      // Specific locations requested - filter to those locations
      query = query
        .innerJoin('stockMovements', 'products.uuid', 'stockMovements.productUuid')
        .where('stockMovements.locationId', 'in', locationIds)
        .groupBy([
          'products.id',
          'products.name', 
          'products.price',
          'products.stockQuantity',
          'products.minimumStock',
          'products.barcode',
          'products.category',
          'products.description',
          'products.imageurl',
          'products.supplierId',
          'products.createdAt',
          'products.updatedAt',
          'products.uuid',
          'suppliers.id',
          'suppliers.name',
          'suppliers.contactPerson',
          'suppliers.phone',
          'suppliers.email',
          'suppliers.address',
          'suppliers.notes',
          'suppliers.createdAt',
          'suppliers.updatedAt'
        ]);
    } else if (accessibleLocationIds.length > 0) {
      // No specific locations requested, but user has limited access - filter to accessible locations
      query = query
        .innerJoin('stockMovements', 'products.uuid', 'stockMovements.productUuid')
        .where('stockMovements.locationId', 'in', accessibleLocationIds)
        .groupBy([
          'products.id',
          'products.name',
          'products.price', 
          'products.stockQuantity',
          'products.minimumStock',
          'products.barcode',
          'products.category',
          'products.description',
          'products.imageurl',
          'products.supplierId',
          'products.createdAt',
          'products.updatedAt',
          'products.uuid',
          'suppliers.id',
          'suppliers.name',
          'suppliers.contactPerson',
          'suppliers.phone',
          'suppliers.email',
          'suppliers.address',
          'suppliers.notes',
          'suppliers.createdAt',
          'suppliers.updatedAt'
        ]);
    }
    // If user has access to all locations and no specific locations requested,
    // no additional filtering is needed - return all products

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

      // Build supplier object if supplier data exists
      const supplier = row.supplierId ? {
        id: row.supplierId,
        name: supplierName!,
        contactPerson: supplierContactPerson,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
        notes: supplierNotes,
        createdAt: supplierCreatedAt!,
        updatedAt: supplierUpdatedAt!
      } as Selectable<Suppliers> : null;

      return {
        ...product,
        supplier
      };
    });
    
    console.log(`Returning ${products.length} products for user with location context`);
    
    // The 'satisfies' operator ensures the output type matches
    return new Response(superjson.stringify(products satisfies OutputType));
  } catch (error) {
    console.error("Error fetching products:", error);
    
    // Handle location access errors specifically
    if (error instanceof Error && error.message.includes('Forbidden:')) {
      return new Response(superjson.stringify({ error: error.message }), { status: 403 });
    }
    
    if (error instanceof Error && error.message.includes('Authentication required:')) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401 });
    }
    
    // In case of an unexpected error, return a 500 status
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch products: ${errorMessage}` }), { status: 500 });
  }
}