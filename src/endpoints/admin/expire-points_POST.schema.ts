import { z } from "zod";
import superjson from 'superjson';

// The schema is empty as authentication is handled via withAuth middleware
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// The output type provides a detailed summary of the expiration process.
export type OutputType = {
  success: boolean;
  expired: number;
  customers: number;
  transactions: number;
  error?: string;
};

/**
 * A type-safe client helper for triggering the points expiration process.
 * Requires admin authentication via Bearer token in headers.
 * @param body - The request body (empty object).
 * @param init - Optional request initialization options (should include Authorization header).
 * @returns A promise that resolves with the summary of the expiration process.
 */
export const postAdminExpirePoints = async (body: InputType = {}, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/expire-points`, {
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