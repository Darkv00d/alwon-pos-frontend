import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type KioskWithLocation = {
  id: number;
  locationId: number;
  locationName: string;
  deviceCode: string;
  deviceIdentifier: string | null;
  name: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
};

export type OutputType = KioskWithLocation[];

export const getAdminKiosks = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/kiosks`, {
    method: 'GET',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};