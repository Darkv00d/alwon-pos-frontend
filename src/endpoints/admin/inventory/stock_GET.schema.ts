import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  productId: z.number().int().positive().optional(),
  // Comma-separated list of numbers
  locationIds: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type StockLevel = {
  productId: number;
  locationId: number;
  qty: number;
};

export type OutputType = {
  ok: true;
  stock: StockLevel[];
} | {
  ok: false;
  error: string;
  issues?: z.ZodIssue[];
};

export const getAdminInventoryStock = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.productId) {
    queryParams.append('productId', String(params.productId));
  }

  const headers = new Headers(init?.headers);
  if (params?.locationIds) {
    headers.set('x-location-ids', params.locationIds);
  }

  const result = await fetch(`/_api/admin/inventory/stock?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers,
  });

  const text = await result.text();
  try {
    const json = superjson.parse<OutputType>(text);
    if (!result.ok && json.ok === false) {
      throw new Error(json.error);
    }
    return json;
  } catch (e) {
    console.error("Failed to parse response from getAdminInventoryStock", text);
    throw new Error("An unexpected error occurred while fetching stock data.");
  }
};