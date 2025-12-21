import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Customers } from "../../helpers/schema";

export const schema = z.object({
  customerId: z.number().int().positive("Customer ID must be a positive integer."),
  pin: z.string().min(1, "PIN is required."),
});

export type InputType = z.infer<typeof schema>;

// Define a subset of customer fields to return upon successful verification
export type VerifiedCustomer = Pick<
  Selectable<Customers>,
  | 'id'
  | 'uuid'
  | 'name'
  | 'email'
  | 'phone'
  | 'customerNumber'
  | 'totalPoints'
  | 'lifetimePoints'
  | 'firstName'
  | 'lastName'
  | 'mobile'
  | 'idNumber'
  | 'idType'
  | 'apartment'
  | 'locationId'
>;

export type OutputType = 
  | {
      verified: true;
      customer: VerifiedCustomer;
    }
  | {
      verified: false;
      reason?: 'no_pin_set' | 'incorrect_pin';
    };

export const postCustomersVerifyPin = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/verify-pin`, {
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