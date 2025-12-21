import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Routes, type Vehicles } from "../helpers/schema";
import { type RouteWithVehicle } from "./routes_GET.schema";

export const schema = z.object({
  id: z.string().optional(),
  date: z.string().datetime().nullable().optional(),
  vehicleId: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  route: RouteWithVehicle;
};

export const postRoutes = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/routes`, {
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