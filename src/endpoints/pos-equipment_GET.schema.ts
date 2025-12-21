import superjson from 'superjson';
import { z } from "zod";
import type { LocationType } from '../helpers/schema';

export const schema = z.object({
  locationId: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type PosEquipmentWithLocation = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId: number;
  locationName: string;
  locationType: LocationType;
  locationAddress: string | null;
};

export type OutputType = {
  equipment: PosEquipmentWithLocation[];
};

export const getPosEquipment = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();
  
  if (validatedParams.locationId !== undefined) {
    searchParams.append('locationId', validatedParams.locationId.toString());
  }
  if (validatedParams.isActive !== undefined) {
    searchParams.append('isActive', validatedParams.isActive.toString());
  }

  const result = await fetch(`/_api/pos-equipment?${searchParams.toString()}`, {
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