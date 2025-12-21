import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type LoyaltySettings } from "../../helpers/schema";

export const settingSchema = z.object({
  settingKey: z.string().min(1),
  settingValue: z.string(), // Stored as numeric in DB, but string is flexible for input
  description: z.string().optional().nullable(),
});

export const schema = z.array(settingSchema);

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<LoyaltySettings>[];

export const postLoyaltySettingsUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/loyalty-settings/update`, {
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