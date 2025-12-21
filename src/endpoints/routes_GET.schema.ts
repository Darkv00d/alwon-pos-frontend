import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Routes, type Vehicles } from "../helpers/schema";

export const schema = z.object({
  date: z.string().optional(), // Expecting YYYY-MM-DD format
  vehicleId: z.coerce.number().optional(),
  status: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type RouteWithVehicle = Selectable<Routes> & {
  vehicle: Selectable<Vehicles> | null;
};

export type OutputType = {
  routes: RouteWithVehicle[];
};

export const getRoutes = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.append("date", params.date);
  if (params.vehicleId) searchParams.append("vehicleId", String(params.vehicleId));
  if (params.status) searchParams.append("status", params.status);

  const result = await fetch(`/_api/routes?${searchParams.toString()}`, {
    method: "GET",
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