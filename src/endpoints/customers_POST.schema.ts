import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Customers } from "../helpers/schema";

export const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  idType: z.enum(["CC", "CE", "PA", "TI"], { required_error: "ID type is required." }),
  idNumber: z.string().min(1, "ID number is required."),
  mobile: z.string().regex(/^3\d{9}$/, "Mobile must be 10 digits starting with 3."),
  locationId: z.number().int().positive(),
  apartment: z.string().min(1, "Apartment is required."),
  dateOfBirth: z.string().optional().nullable(), // Using string to be compatible with date pickers
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Customers>;

export const postCustomers = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers`, {
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