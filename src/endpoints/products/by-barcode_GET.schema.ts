import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../../helpers/schema";

export const InputSchema = z.object({
  barcode: z.string().min(1, "Barcode is required."),
  locationId: z.coerce.number().int().positive().optional(),
});

export type InputType = z.infer<typeof InputSchema>;

export type ProductWithStockAndSupplier = Selectable<Products> & {
  supplier: Selectable<Suppliers> | null;
};

export type OutputType = ProductWithStockAndSupplier;

export const getProductByBarcode = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = InputSchema.parse(params);
  
  const searchParams = new URLSearchParams();
  searchParams.set('barcode', validatedParams.barcode);
  if (validatedParams.locationId) {
    searchParams.set('locationId', validatedParams.locationId.toString());
  }
  
  const queryString = searchParams.toString();
  const url = `/_api/products/by-barcode?${queryString}`;
  
  const result = await fetch(url, {
    method: "GET",
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