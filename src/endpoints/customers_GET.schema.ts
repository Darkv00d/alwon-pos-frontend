import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Customers } from "../helpers/schema";

// This schema is for validating query parameters.
export const schema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Array<Selectable<Customers> & {
  tierName: string | null;
  tierColor: string | null;
  tierIcon: string | null;
  tierMinPoints: number | null;
  tierMultiplier: string | null;
  tierDiscount: string | null;
}>;

export const getCustomers = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.set('search', params.search);
  }
  if (params?.isActive !== undefined) {
    queryParams.set('isActive', String(params.isActive));
  }
  
  const queryString = queryParams.toString();
  const url = `/_api/customers${queryString ? `?${queryString}` : ''}`;

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