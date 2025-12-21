import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Promotions, Products, Categories, Locations } from "../helpers/schema";

export const schema = z.object({
  active: z.boolean().optional(),
  promotionType: z.string().optional(),
  search: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

type PromotionWithRelations = Selectable<Promotions> & {
  products: Pick<Selectable<Products>, "id" | "name" | "sku">[];
  categories: Pick<Selectable<Categories>, "id" | "name">[];
  locations: Pick<Selectable<Locations>, "id" | "name" | "code" | "locationType">[];
};

export type OutputType = PromotionWithRelations[];

export const getPromotions = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.active !== undefined)
      searchParams.append("active", String(params.active));
    if (params.promotionType)
      searchParams.append("promotionType", params.promotionType);
    if (params.search) searchParams.append("search", params.search);
  }

  const result = await fetch(`/_api/promotions?${searchParams.toString()}`, {
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