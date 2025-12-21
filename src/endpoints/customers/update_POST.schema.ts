import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Customers } from "../../helpers/schema";

// Schema for updating customer with new required fields
export const schema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1, "First name is required.").optional(),
  lastName: z.string().min(1, "Last name is required.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  idType: z.enum(["CC", "CE", "PA", "TI"]).optional(),
  idNumber: z.string().min(1, "ID number is required.").optional(),
  mobile: z.string().regex(/^3\d{9}$/, "Mobile must be 10 digits starting with 3.").optional(),
  locationId: z.number().int().positive().optional(),
  apartment: z.string().min(1, "Apartment is required.").optional(),
  dateOfBirth: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  pinEnabled: z.boolean().optional(),
  pinHash: z.string().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Customers>;

export const postCustomersUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/update`, {
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