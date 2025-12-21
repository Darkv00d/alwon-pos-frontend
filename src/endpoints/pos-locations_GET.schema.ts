import superjson from 'superjson';
import { z } from "zod";
import type { LocationType } from '../helpers/schema';

// No input schema needed for a GET request
export const schema = z.object({});

export type PosLocation = {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
  locationId: number;
  locationName: string;
  locationType: LocationType;
  address: string | null;
};

export type OutputType = {
  ok: true;
  locations: PosLocation[];
};

export const getPosLocations = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/pos-locations`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{error: string;}>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};