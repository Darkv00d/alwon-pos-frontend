import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products } from "../../helpers/schema";

export const schema = z.object({
  id: z.number().int().positive("Product ID must be a positive integer.").optional(),
  name: z.string().min(2, "Product name must be at least 2 characters long."),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a non-negative number.",
  }).optional(),
  cost: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Cost must be a non-negative number.",
  }).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  subcategoryId: z.number().int().positive().optional().nullable(),
  preferredSupplierId: z.number().int().positive().optional().nullable(),
  imageurl: z.string().url("Image URL must be a valid URL.").optional().nullable(),
  isActive: z.boolean().optional(),
  // Fields from existing product endpoints, not in user request but good to have for consistency
  stockQuantity: z.number().int().min(0, "Stock quantity must be a non-negative integer.").optional(),
  minimumStock: z.number().int().min(0, "Minimum stock must be a non-negative integer.").optional(),
  description: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = 
  | { ok: true; product: Selectable<Products> }
  | { ok: false; error: string };

export const postProductsUpsert = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/products/upsert`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  // The response is always expected to be JSON, even for errors.
  const responseJson = await result.text();
  const parsed = superjson.parse<OutputType>(responseJson);

  if (!result.ok && 'error' in parsed) {
    throw new Error(parsed.error);
  }
  
  if (!parsed.ok) {
    throw new Error(parsed.error || 'An unknown error occurred during upsert.');
  }

  return parsed;
};