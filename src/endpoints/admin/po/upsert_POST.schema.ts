import { z } from "zod";
import { PurchaseOrderStatusArrayValues } from "../../../helpers/schema";

const itemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const schema = z.object({
  purchaseOrderId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  expectedDate: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(PurchaseOrderStatusArrayValues).optional(),
  items: z
    .array(itemSchema)
    .min(1, "A purchase order must have at least one item.")
    .optional(),
}).refine(
  (data) => {
    // For creating new POs, supplierId is required
    if (!data.purchaseOrderId && !data.supplierId) {
      return false;
    }
    return true;
  },
  {
    message: "supplierId is required when creating a new purchase order",
    path: ["supplierId"],
  }
).refine(
  (data) => {
    // For creating new POs, items are required
    if (!data.purchaseOrderId && (!data.items || data.items.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "items are required when creating a new purchase order",
    path: ["items"],
  }
);

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  purchaseOrderId: number;
};

export const postAdminUpsertPurchaseOrder = async (
  token: string,
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/po/upsert`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json();
    throw new Error(errorObject.error || "Failed to upsert purchase order");
  }

  return result.json();
};