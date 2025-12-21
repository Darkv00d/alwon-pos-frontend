import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type PointsTransactions } from "../../helpers/schema";

export const schema = z.object({
  customerId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<PointsTransactions>[];

export const getCustomersPointsTransactions = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const queryParams = new URLSearchParams({
    customerId: String(validatedParams.customerId),
  });
  
  const url = `/_api/customers/points-transactions?${queryParams.toString()}`;

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