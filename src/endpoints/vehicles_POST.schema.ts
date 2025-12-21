import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Vehicles } from "../helpers/schema";

export const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Vehicle name is required."),
  capacity: z.number().positive("Capacity must be a positive number.").nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  vehicle: Selectable<Vehicles>;
};

export const postVehicles = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/vehicles`, {
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