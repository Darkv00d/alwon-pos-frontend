import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type StockMovements } from "../../../helpers/schema";

export const schema = z.object({
  productUuid: z.string().uuid(),
  quantity: z.number().refine(val => val !== 0, { message: "Quantity cannot be zero." }),
  reason: z.string().min(1, { message: "Reason is required for adjustments." }),
  lotId: z.string(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<StockMovements>;

export const postAdminInventoryAdjust = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/inventory/adjust`, {
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