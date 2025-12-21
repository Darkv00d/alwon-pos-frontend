import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  productUuid: z.string().uuid("Invalid product UUID"),
  locationId: z.number().int().positive("Location ID must be a positive integer"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  availableStock: number;
};

export const getStockAvailable = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const queryParams = new URLSearchParams({
    productUuid: validatedParams.productUuid,
    locationId: validatedParams.locationId.toString(),
  });

  const result = await fetch(`/_api/inventory/stock-available?${queryParams.toString()}`, {
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