import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type LoyaltyCampaigns } from "../helpers/schema";

export const schema = z.object({
  id: z.string().min(1, "Campaign ID is required."),
  name: z.string().min(1, "Campaign name is required."),
  description: z.string().optional().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  pointsMultiplier: z.coerce.number().positive("Points multiplier must be a positive number."),
  productIds: z.array(z.number().int().positive()).optional().default([]),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<LoyaltyCampaigns>;

export const postLoyaltyCampaigns = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/loyalty-campaigns`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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