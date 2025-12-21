import { z } from "zod";
import superjson from "superjson";

export type OutputType = {
  success: true;
  purchaseOrderIds: number[];
  count: number;
};

export const postAutoGeneratePurchaseOrders = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/purchase-orders/auto-generate`, {
    method: "POST",
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