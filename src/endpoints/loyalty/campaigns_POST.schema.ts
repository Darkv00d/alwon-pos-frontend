import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Campaign name is required."),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  pointsMultiplier: z.coerce.number().min(1, "Points multiplier must be at least 1.").max(10, "Points multiplier cannot exceed 10."),
  productIds: z.array(z.number().int().positive()).optional(),
  isActive: z.boolean().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; campaignId: string };

export const postLoyaltyCampaigns = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/loyalty/campaigns`, {
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