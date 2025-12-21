import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../../helpers/schema";

// Query parameters schema
export const InputSchema = z.object({
  q: z.string().optional().describe("Search query for product name and barcode")
});

export type InputType = z.infer<typeof InputSchema>;

// Location filtering is handled via the 'X-Location-Id' header.

export type ProductWithSupplier = Selectable<Products> & {
  supplier: Selectable<Suppliers> | null;
};

export type OutputType = ProductWithSupplier[];

export const getKioskProducts = async (params?: { q?: string }, init?: RequestInit): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.set('q', params.q);
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/_api/kiosk/products?${queryString}` : `/_api/kiosk/products`;
  
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