import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  productUuid: z.string().uuid().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type KardexEntry = {
  id: string;
  createdAt: Date;
  type: "ADJUSTMENT" | "RECEIPT" | "RETURN" | "SALE" | "TRANSFER";
  qty: string;
  ref: string | null;
  reason: string | null;
  productUuid: string | null;
  productName: string | null;
  productBarcode: string | null;
  locationId: number | null;
  locationName: string | null;
  lotId: string | null;
  lotCode: string | null;
  lotExpiresOn: Date | null;
};

export type OutputType = KardexEntry[];

export const getAdminInventoryKardex = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
  }

  const result = await fetch(`/_api/admin/inventory/kardex?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};