import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  token: z.string().uuid(),
  newPassword: z.string().min(8),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: boolean;
  error?: string;
};

export const postResetPassword = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/auth/reset-password`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const errorObject = superjson.parse<{ ok: boolean; error: string }>(text);
    throw new Error(errorObject.error || "Error al restablecer la contraseña.");
  }

  return superjson.parse<OutputType>(text);
};