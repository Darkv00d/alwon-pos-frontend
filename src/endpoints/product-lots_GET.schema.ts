import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type ProductLots, type Products } from "../helpers/schema";

export const schema = z.object({
  productUuid: z.string().uuid().optional(),
});

export type InputType = z.infer<typeof schema>;

export type ProductLotWithProduct = Selectable<ProductLots> & {
  product: Selectable<Products> | null;
};

export type OutputType = ProductLotWithProduct[];

export const getProductLots = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.productUuid) {
    queryParams.append('productUuid', params.productUuid);
  }

  const result = await fetch(`/_api/product-lots?${queryParams.toString()}`, {
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