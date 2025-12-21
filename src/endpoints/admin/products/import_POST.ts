import { db } from "../../../helpers/db";
import { schema, OutputType, RowError } from "./import_POST.schema";
import superjson from 'superjson';
import { z } from "zod";
import { type Insertable, type Updateable } from "kysely";
import { type Products } from "../../../helpers/schema";

const MAX_ROWS = 10000;

// Schema for a single processed row, used internally for validation
const productRowSchema = z.object({
  sku: z.string().min(1, "SKU is required and cannot be empty."),
  name: z.string().min(1, "Name is required and cannot be empty."),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a non-negative number.",
  }).optional().nullable(),
  cost: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Cost must be a non-negative number.",
  }).optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  subcategoryId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  preferredSupplierId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL.").optional().nullable(),
});

// Helper function to find or create category by name
async function findOrCreateCategory(name: string, trx: any): Promise<number> {
  const existing = await trx
    .selectFrom('categories')
    .select('id')
    .where('name', '=', name)
    .executeTakeFirst();

  if (existing) {
    return existing.id;
  }

  const created = await trx
    .insertInto('categories')
    .values({ name })
    .returning('id')
    .executeTakeFirst();

  return created.id;
}

// Helper function to find or create subcategory by name
async function findOrCreateSubcategory(name: string, categoryId: number | null, trx: any): Promise<number> {
  const existing = await trx
    .selectFrom('subcategories')
    .select('id')
    .where('name', '=', name)
    .executeTakeFirst();

  if (existing) {
    return existing.id;
  }

  const created = await trx
    .insertInto('subcategories')
    .values({ 
      name,
      categoryId 
    })
    .returning('id')
    .executeTakeFirst();

  return created.id;
}

// Helper function to find or create supplier by name
async function findOrCreateSupplier(name: string, trx: any): Promise<number> {
  const existing = await trx
    .selectFrom('suppliers')
    .select('id')
    .where('name', '=', name)
    .executeTakeFirst();

  if (existing) {
    return existing.id;
  }

  const created = await trx
    .insertInto('suppliers')
    .values({ 
      name,
      isActive: true
    })
    .returning('id')
    .executeTakeFirst();

  return created.id;
}

export async function handle(request: Request) {
  try {
    const requestText = await request.text();
    let json;
    
    try {
      // First try regular JSON parsing
      json = JSON.parse(requestText);
      
      // Check if it's wrapped by superjson and extract the json property directly
      if (json && typeof json === 'object' && json.json) {
        json = json.json;
      }
    } catch {
      // If JSON.parse fails, try superjson.parse as fallback
      json = superjson.parse(requestText);
    }
    
    const { rows, mapping } = schema.parse(json);

    if (rows.length > MAX_ROWS) {
      throw new Error(`Too many rows. The maximum is ${MAX_ROWS}.`);
    }

    const errors: RowError[] = [];
    const validProducts: { rowIndex: number, data: z.infer<typeof productRowSchema> }[] = [];

    // 1. Validate and transform rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i;

      const productData = {
        sku: row[mapping.sku],
        name: row[mapping.name],
        price: mapping.price ? row[mapping.price] : undefined,
        cost: mapping.cost ? row[mapping.cost] : undefined,
        barcode: mapping.barcode ? row[mapping.barcode] : undefined,
        categoryId: mapping.categoryId ? (row[mapping.categoryId] ? 
          (isNaN(parseInt(row[mapping.categoryId], 10)) ? row[mapping.categoryId] : parseInt(row[mapping.categoryId], 10)) 
          : undefined) : undefined,
        subcategoryId: mapping.subcategoryId ? (row[mapping.subcategoryId] ? 
          (isNaN(parseInt(row[mapping.subcategoryId], 10)) ? row[mapping.subcategoryId] : parseInt(row[mapping.subcategoryId], 10)) 
          : undefined) : undefined,
        preferredSupplierId: mapping.preferredSupplierId ? (row[mapping.preferredSupplierId] ? 
          (isNaN(parseInt(row[mapping.preferredSupplierId], 10)) ? row[mapping.preferredSupplierId] : parseInt(row[mapping.preferredSupplierId], 10)) 
          : undefined) : undefined,
        imageUrl: mapping.imageUrl ? row[mapping.imageUrl] : undefined,
      };

      const validationResult = productRowSchema.safeParse(productData);

      if (!validationResult.success) {
        const formattedErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        errors.push({ rowIndex, message: formattedErrors });
      } else {
        validProducts.push({ rowIndex, data: validationResult.data });
      }
    }

    if (validProducts.length === 0) {
      return new Response(superjson.stringify({
        createdCount: 0,
        updatedCount: 0,
        errorCount: errors.length,
        errors,
      } satisfies OutputType), { status: 200 });
    }

    // 2. Perform DB operations in a transaction
    let createdCount = 0;
    let updatedCount = 0;

    await db.transaction().execute(async (trx) => {
      for (const { rowIndex, data } of validProducts) {
        try {
          const { sku, ...productValues } = data;
          
          // Convert string names to IDs for categories, subcategories, and suppliers
          let resolvedCategoryId = productValues.categoryId;
          let resolvedSubcategoryId = productValues.subcategoryId;
          let resolvedPreferredSupplierId = productValues.preferredSupplierId;

          // Handle category ID/name conversion
          if (typeof productValues.categoryId === 'string') {
            resolvedCategoryId = await findOrCreateCategory(productValues.categoryId, trx);
          }

          // Handle subcategory ID/name conversion
          if (typeof productValues.subcategoryId === 'string') {
            resolvedSubcategoryId = await findOrCreateSubcategory(
              productValues.subcategoryId, 
              resolvedCategoryId as number || null, 
              trx
            );
          }

          // Handle supplier ID/name conversion
          if (typeof productValues.preferredSupplierId === 'string') {
            resolvedPreferredSupplierId = await findOrCreateSupplier(productValues.preferredSupplierId, trx);
          }

          // Check if product exists to determine if it's create or update
          const existingProduct = await trx
            .selectFrom('products')
            .select('id')
            .where('sku', '=', sku)
            .executeTakeFirst();

          // Prepare final product values with resolved IDs
          const finalProductValues = {
            ...productValues,
            categoryId: resolvedCategoryId as number | null,
            subcategoryId: resolvedSubcategoryId as number | null,
            preferredSupplierId: resolvedPreferredSupplierId as number | null,
          };
          
          // Kysely's insert with onConflictDoUpdate handles the upsert logic
          await trx
            .insertInto('products')
            .values({
              sku,
              ...finalProductValues,
            } as Insertable<Products>)
            .onConflict((oc) => oc
              .column('sku')
              .doUpdateSet(finalProductValues as Updateable<Products>)
            )
            .executeTakeFirst();

          if (existingProduct) {
            updatedCount++;
          } else {
            createdCount++;
          }

        } catch (dbError) {
          console.error(`Error processing row ${rowIndex} for SKU ${data.sku}:`, dbError);
          const message = dbError instanceof Error ? dbError.message : "Database operation failed.";
          errors.push({ rowIndex, message: `DB Error: ${message}` });
        }
      }
    });

    const response: OutputType = {
      createdCount,
      updatedCount,
      errorCount: errors.length,
      errors,
    };

    return new Response(superjson.stringify(response), { status: 200 });

  } catch (error) {
    console.error("Error importing products:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to import products: ${errorMessage}` }), { status: 400 });
  }
}