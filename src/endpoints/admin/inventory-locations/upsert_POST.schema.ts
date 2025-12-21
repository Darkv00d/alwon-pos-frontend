import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Locations, LocationTypeArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  locationType: z.enum(LocationTypeArrayValues),
  isActive: z.boolean().default(true),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  message: string;
  location: Selectable<Locations>;
};

export const postAdminInventoryLocationsUpsert = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/inventory-locations/upsert`, {
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