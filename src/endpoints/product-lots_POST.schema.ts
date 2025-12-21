import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type ProductLots } from "../helpers/schema";

export const schema = z.object({
  id: z.string().optional(), // For updating existing lots
  productUuid: z.string().uuid(),
  lotCode: z.string().min(1, "Lot code is required.").nullable().optional(),
  expiresOn: z.coerce.date().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<ProductLots>;

export const postProductLots = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/product-lots`, {
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