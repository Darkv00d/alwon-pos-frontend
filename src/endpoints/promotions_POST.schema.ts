import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Promotions } from "../helpers/schema";

export const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  promotionType: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().optional().nullable(),
  // Discount config
  discountPercentage: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  buyQuantity: z.number().optional().nullable(),
  getQuantity: z.number().optional().nullable(),
  minQuantity: z.number().optional().nullable(),
  // Usage limits
  maxTotalUses: z.number().optional().nullable(),
  maxUsesPerCustomer: z.number().optional().nullable(),
  // Relations
  productIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  locationIds: z.array(z.number()).optional(),
  appliesToAllLocations: z.boolean().default(false),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Promotions>;

export const postPromotions = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/promotions`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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