import { z } from "zod";
import superjson from 'superjson';

const productDbFields = z.enum([
  "sku",
  "name",
  "price",
  "cost",
  "barcode",
  "categoryId",
  "subcategoryId",
  "preferredSupplierId",
  "imageUrl"
]);

export const schema = z.object({
  // Mapping from DB field to the CSV header/key provided by the user
  mapping: z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    price: z.string().nullish(),
    cost: z.string().nullish(),
    barcode: z.string().nullish(),
    categoryId: z.string().nullish(),
    subcategoryId: z.string().nullish(),
    preferredSupplierId: z.string().nullish(),
    imageUrl: z.string().nullish(),
  }),
  // Array of rows, where each row is an object with CSV headers as keys
  rows: z.array(z.record(z.string())),
}).refine(data => data.rows.length <= 10000, {
  message: "A maximum of 10,000 rows can be imported at a time.",
});

export type InputType = z.infer<typeof schema>;

export type RowError = {
  rowIndex: number;
  message: string;
};

export type OutputType = {
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  errors: RowError[];
};

export const postAdminProductsImport = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/products/import`, {
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