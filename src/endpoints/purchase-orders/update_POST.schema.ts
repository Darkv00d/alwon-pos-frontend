import { z } from "zod";
import superjson from "superjson";
import { PurchaseOrderStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  purchaseOrderId: z.number().int().positive(),
  status: z.enum(PurchaseOrderStatusArrayValues).optional(),
  notes: z.string().optional().nullable(),
  expectedDate: z.date().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().positive(),
        taxRate: z.number().min(0).max(100).optional(),
      })
    )
    .optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  purchaseOrderId: number;
};

export const postUpdatePurchaseOrder = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/purchase-orders/update`, {
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