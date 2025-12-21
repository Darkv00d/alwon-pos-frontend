import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Stops, Routes } from "../helpers/schema";
import { VehicleSelection } from "../helpers/withVehicle";

export const schema = z.object({
  routeId: z.string().uuid().optional(),
});

export type InputType = z.infer<typeof schema>;

export type StopWithRoute = Selectable<Stops> & {
  route: (Selectable<Routes> & { vehicle: VehicleSelection | null }) | null;
};

export type OutputType = {
  stops: StopWithRoute[];
};

export const getStops = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.routeId) {
    searchParams.set("routeId", params.routeId);
  }

  const result = await fetch(`/_api/stops?${searchParams.toString()}`, {
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