import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  daysWindow: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  created: number;
  updated: number;
  dismissed: number;
};

export const postAdminReorderRecompute = async (
  locationIds: number[],
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/reorder/recompute`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Location-Ids": locationIds.join(","),
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error || "Failed to recompute suggestions");
  }

  return superjson.parse<OutputType>(await result.text());
};