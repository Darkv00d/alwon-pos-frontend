import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  locationId: z.number().int().positive().optional(),
  channel: z.enum(["pos", "kiosk", "online", "wholesale"]).optional(),
  customerId: z.number().int().positive().optional(),
  couponCode: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  data?: {
    basePrice: number;
    finalPrice: number;
    discount: number;
    appliedPromotions: Array<{
      promotionId: string;
      promotionName: string;
      discountAmount: number;
    }>;
  };
  error?: string;
};

export const postProductsCalculatePrice = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/products/calculate-price`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      throw new Error(errorObject.error);
    } catch (e) {
      throw new Error(`An unknown error occurred: ${text}`);
    }
  }

  return superjson.parse<OutputType>(text);
};