import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Suppliers } from "../helpers/schema";

export const schema = z.object({
  q: z.string().optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  suppliers: Selectable<Suppliers>[];
};

export const getSuppliers = async (params?: { q?: string; includeInactive?: boolean }, init?: RequestInit): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.set("q", params.q);
  }
  if (params?.includeInactive) {
    searchParams.set("includeInactive", params.includeInactive.toString());
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/_api/suppliers?${queryString}` : "/_api/suppliers";

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