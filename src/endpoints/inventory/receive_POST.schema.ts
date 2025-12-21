import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type StockMovements } from "../../helpers/schema";

export const ReceivedItemSchema = z.object({
  productUuid: z.string().uuid("Product UUID must be a valid UUID."),
  quantity: z.number().positive("Quantity must be a positive number."),
  lotCode: z.string().min(1, "Lot code cannot be empty.").optional(),
  expiresOn: z.date().optional(),
}).refine(data => !data.expiresOn || !!data.lotCode, {
  message: "An expiration date can only be provided if a lot code is also present.",
  path: ["expiresOn"],
});

export const schema = z.object({
  items: z.array(ReceivedItemSchema).min(1, "At least one item must be received."),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  message: string;
  stockMovements: Selectable<StockMovements>[];
};

export const postInventoryReceive = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/inventory/receive`, {
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