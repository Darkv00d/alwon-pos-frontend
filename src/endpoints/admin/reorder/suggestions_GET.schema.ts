import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  status: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type Suggestion = {
  id: number;
  status: string;
  suggestedQty: number;
  currentStock: number;
  demandDaily: number;
  rop: number;
  targetStock: number;
  createdAt: Date | null;
  productId: number;
  productName: string;
  productSku: string | null;
  productPrice: number;
  locationId: number;
  locationName: string;
  supplierId: number | null;
  supplierName: string | null;
};

export type OutputType = Suggestion[];

export const getAdminReorderSuggestions = async (
  locationIds: number[],
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    searchParams.set("status", params.status);
  }

  const result = await fetch(`/_api/admin/reorder/suggestions?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Location-Ids": locationIds.join(","),
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error || "Failed to get reorder suggestions");
  }

  return superjson.parse<OutputType>(await result.text());
};