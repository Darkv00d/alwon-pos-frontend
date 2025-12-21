import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type StockMovements, type Products, type Locations, type ProductLots, MoveTypeArrayValues } from "../helpers/schema";

export const schema = z.object({
  productUuid: z.string().uuid().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  lotId: z.string().optional(),
  type: z.enum(MoveTypeArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type StockMovementWithDetails = Selectable<StockMovements> & {
  product: Selectable<Products> | null;
  location: Selectable<Locations> | null;
  lot: Selectable<ProductLots> | null;
};

export type OutputType = StockMovementWithDetails[];

export const getStockMovements = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const result = await fetch(`/_api/stock-movements?${queryParams.toString()}`, {
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