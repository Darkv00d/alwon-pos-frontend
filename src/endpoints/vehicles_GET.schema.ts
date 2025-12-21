import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Vehicles } from "../helpers/schema";

export const schema = z.object({});

export type OutputType = {
  vehicles: Selectable<Vehicles>[];
};

export const getVehicles = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/vehicles`, {
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