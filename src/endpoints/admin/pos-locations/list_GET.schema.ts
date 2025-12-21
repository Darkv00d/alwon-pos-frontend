import superjson from "superjson";
import { z } from "zod";
import { type Selectable } from "kysely";
import { type Locations } from "../../../helpers/schema";

// No input schema needed for a GET request
export const schema = z.object({});

export type PosLocationAdmin = Selectable<Locations>;

export type OutputType = {
  ok: true;
  posLocations: PosLocationAdmin[];
};

export const getAdminPosLocations = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/pos-locations/list`, {
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