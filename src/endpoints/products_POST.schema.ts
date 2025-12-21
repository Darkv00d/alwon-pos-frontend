import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products } from "../helpers/schema";

export const schema = z.object({
  name: z.string().min(1, "Product name is required."),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a non-negative number.",
  }),
  stockQuantity: z.number().int().min(0, "Stock quantity must be a non-negative integer.").optional().default(0),
  minimumStock: z.number().int().min(0, "Minimum stock must be a non-negative integer.").optional().default(0),
  barcode: z.string().max(50).optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  supplierId: z.number().int().positive("Supplier ID must be a positive integer.").optional().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL.").optional().nullable(),
  promotionalLabel: z.string().max(50, "Promotional label must be 50 characters or less.").optional().nullable(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Products>;

export const postProducts = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/products`, {
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