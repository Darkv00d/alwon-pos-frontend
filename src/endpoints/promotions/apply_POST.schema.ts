import { z } from "zod";
import superjson from "superjson";
import type { CartTotal } from "../../helpers/pricingTypes";

export const schema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
      // Price is included for context but calculateCartTotal will refetch it
      price: z.number(),
    })
  ),
  customerId: z.number().optional(),
  locationId: z.number().optional(),
  channel: z.string().optional(),
  couponCode: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = CartTotal;

export const postPromotionsApply = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/promotions/apply`, {
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