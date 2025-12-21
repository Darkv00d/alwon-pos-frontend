import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type StockMovements } from "../../../helpers/schema";

export const schema = z.object({
  productUuid: z.string().uuid(),
  quantity: z.number().positive({ message: "Transfer quantity must be positive." }),
  fromLocationId: z.number().int().positive(),
  toLocationId: z.number().int().positive(),
  reference: z.string().optional(),
  lotId: z.string(),
}).refine(data => data.fromLocationId !== data.toLocationId, {
  message: "Origin and destination locations cannot be the same.",
  path: ["toLocationId"],
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  message: string;
  reference: string;
  movements: Selectable<StockMovements>[];
};

export const postAdminInventoryTransfer = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/inventory/transfer`, {
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