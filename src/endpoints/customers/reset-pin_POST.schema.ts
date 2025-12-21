import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  identifier: z.string().min(1, "Identifier (email or phone) cannot be empty."),
  newPin: z.string().regex(/^\d{4,6}$/, "PIN must be between 4 and 6 digits."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  customerName?: string;
};

export const postCustomersResetPin = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/reset-pin`, {
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