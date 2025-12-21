import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Suppliers } from "../../helpers/schema";

export const schema = z.object({
  id: z.coerce.number().int().positive({ message: "ID must be a positive integer." }),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  supplier: Selectable<Suppliers>;
};

export const getSupplierById = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    id: validatedParams.id.toString(),
  });

  const result = await fetch(`/_api/suppliers/by-id?${searchParams.toString()}`, {
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