import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Locations } from "../../../helpers/schema";
import { posLocationSchema } from "../../../helpers/posLocationSchema";

export const schema = posLocationSchema;

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: true;
  message: string;
  posLocation: Selectable<Locations>;
};

export const postAdminPosLocationsUpsert = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/pos-locations/upsert`, {
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