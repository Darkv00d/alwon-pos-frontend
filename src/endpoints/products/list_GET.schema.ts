import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Products } from "../../helpers/schema";

// Define the shape of a single product in the output, selecting specific fields.
export type ProductListItem = Pick<
  Selectable<Products>,
  | "id"
  | "uuid"
  | "name"
  | "sku"
  | "barcode"
  | "price"
  | "cost"
  | "categoryId"
  | "subcategoryId"
  | "preferredSupplierId"
  | "imageurl"
  | "isActive"
>;

export const schema = z.object({
  q: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType =
  | {
      ok: true;
      products: ProductListItem[];
    }
  | {
      ok: false;
      error: string;
    };

export const getProductsList = async (
  query: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedQuery = schema.parse(query);
  const searchParams = new URLSearchParams();
  if (validatedQuery.q) {
    searchParams.set("q", validatedQuery.q);
  }

  const result = await fetch(`/_api/products/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  const responseObject = superjson.parse<OutputType>(responseText);

  if (!result.ok) {
    const errorMessage =
      "error" in responseObject ? responseObject.error : "An unknown error occurred";
    throw new Error(errorMessage);
  }

  if (!responseObject.ok) {
    throw new Error(responseObject.error);
  }

  return responseObject;
};