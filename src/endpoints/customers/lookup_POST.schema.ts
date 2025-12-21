import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Customers } from "../../helpers/schema";

export const schema = z.object({
  identifier: z.string().min(1, "Identifier is required."),
});

export type InputType = z.infer<typeof schema>;

export type LookupCustomer = Pick<
  Selectable<Customers>,
  | 'id'
  | 'uuid'
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'mobile'
  | 'idNumber'
  | 'email'
  | 'customerNumber'
  | 'totalPoints'
  | 'lifetimePoints'
  | 'apartment'
  | 'locationId'
>;

export type OutputType = LookupCustomer;

export const postCustomersLookup = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/lookup`, {
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