import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import {
  type PurchaseOrders,
  type Suppliers,
  type PurchaseOrderItems,
  type Products,
} from "../helpers/schema";

export type PurchaseOrderItemWithProduct = Selectable<PurchaseOrderItems> & {
  product: Selectable<Products>;
};

export type PurchaseOrderDetails = Selectable<PurchaseOrders> & {
  supplier: Selectable<Suppliers>;
  items: PurchaseOrderItemWithProduct[];
};

export type OutputType = {
  purchaseOrders: PurchaseOrderDetails[];
};

export const getPurchaseOrders = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/purchase-orders`, {
    method: "GET",
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