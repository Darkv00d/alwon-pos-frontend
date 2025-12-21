import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Pods } from "../helpers/schema";

export const schema = z.object({
  stopId: z.string().uuid(),
  signedBy: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  pod: Selectable<Pods>;
};

export const postPod = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/pods`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(
      await result.text()
    );
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};