import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  message: string;
  // TODO: This should be removed in production. It's here for development convenience.
  token?: string;
};

export const postResetPasswordRequest = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/reset-password-request`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      throw new Error(errorObject.error);
    } catch (e) {
      throw new Error("An unexpected error occurred during password reset request.");
    }
  }

  return superjson.parse<OutputType>(text);
};