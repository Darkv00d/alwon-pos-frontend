import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type StockMovements, MoveTypeArrayValues } from "../helpers/schema";

export const schema = z.object({
  productUuid: z.string().uuid(),
  qty: z.number().refine(val => val !== 0, { message: "Quantity cannot be zero." }),
  type: z.enum(MoveTypeArrayValues),
  locationId: z.number().int().positive().nullable().optional(),
  lotId: z.string(),
  ref: z.string().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<StockMovements>;

export const postStockMovements = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/stock-movements`, {
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