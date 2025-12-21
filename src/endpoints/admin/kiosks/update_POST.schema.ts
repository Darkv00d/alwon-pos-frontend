import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  locationId: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

type Kiosk = {
  id: number;
  locationId: number;
  locationName: string;
  deviceCode: string;
  deviceIdentifier: string | null;
  name: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OutputType = {
  success: true;
  kiosk: Kiosk;
} | {
  success: false;
  error: string;
};

export const postAdminKiosksUpdate = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/kiosks/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      throw new Error(errorObject.error);
    } catch (e) {
      throw new Error(`An unexpected error occurred: ${result.statusText}`);
    }
  }
  
  return superjson.parse<OutputType>(text);
};