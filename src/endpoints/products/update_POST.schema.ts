import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products } from "../../helpers/schema";

export const schema = z.object({
  id: z.number().int().positive("Product ID must be a positive integer."),
  name: z.string().min(1, "Product name is required.").optional(),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a non-negative number.",
  }).optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be a non-negative integer.").optional(),
  minimumStock: z.number().int().min(0, "Minimum stock must be a non-negative integer.").optional(),
  barcode: z.string().max(50).nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  supplierId: z.number().int().positive("Supplier ID must be a positive integer.").nullable().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL.").nullable().optional(),
  promotionalLabel: z.string().max(50, "Promotional label must be 50 characters or less.").nullable().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Products>;

export const postProductsUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/products/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};