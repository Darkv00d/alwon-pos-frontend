import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  suggestionIds: z.array(z.number().int().positive()).min(1),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: true;
  createdPOs: {
    poId: number;
    supplierId: number;
    locationId: number;
    itemsCount: number;
  }[];
};

export const postAdminReorderApply = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/reorder/apply`, {
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
    throw new Error(errorObject.error || "Failed to apply suggestions");
  }

  return superjson.parse<OutputType>(await result.text());
};