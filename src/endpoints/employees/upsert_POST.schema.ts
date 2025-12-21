import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Employees } from "../../helpers/schema";

export const schema = z.object({
  uuid: z.string().uuid().optional(),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address.").optional().nullable(),
  phone: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  pin: z.string().min(4, "PIN must be at least 4 digits.").max(6, "PIN cannot be more than 6 digits.").optional(),
  hireDate: z.string().datetime({ message: "Invalid date format. Use ISO 8601 format." }).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  defaultLocationId: z.number().int().positive().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

// Output should be the employee record, but without the pinHash
export type OutputType = Omit<Selectable<Employees>, 'pinHash' | 'passwordHash'>;

export const postUpsertEmployee = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/employees/upsert`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string; details?: any }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};