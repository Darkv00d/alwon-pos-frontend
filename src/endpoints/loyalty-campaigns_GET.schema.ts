import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type LoyaltyCampaigns } from "../helpers/schema";

export const schema = z.object({
  isActive: z.boolean().optional(),
  includeProducts: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type LoyaltyCampaignWithProducts = Selectable<LoyaltyCampaigns> & {
  productIds?: number[];
};

export type OutputType = LoyaltyCampaignWithProducts[];

export const getLoyaltyCampaigns = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.isActive !== undefined) {
    queryParams.set('isActive', String(params.isActive));
  }
  if (params?.includeProducts) {
    queryParams.set('includeProducts', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = `/_api/loyalty-campaigns${queryString ? `?${queryString}` : ''}`;

  const result = await fetch(url, {
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