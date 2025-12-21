import superjson from 'superjson';
import { z } from "zod";
import { Selectable } from 'kysely';
import { PosEquipment } from '../helpers/schema';

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  locationId: z.number().int("Location ID must be an integer"),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  equipment: Selectable<PosEquipment>;
};

export const postPosEquipment = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/pos-equipment`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<{error: string;}>(responseText);
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(responseText);
};