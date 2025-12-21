import { z } from "zod";
import { type Selectable } from "kysely";
import {
  type PurchaseOrders,
  type Suppliers,
  type PurchaseOrderItems,
  type Products,
} from "../../../helpers/schema";

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

export const getAdminPurchaseOrders = async (
  token: string,
  searchQuery?: string,
  init?: RequestInit
): Promise<OutputType> => {
  const url = new URL(`/_api/admin/po/list`, window.location.origin);
  if (searchQuery) {
    url.searchParams.set("q", searchQuery);
  }

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json();
    throw new Error(errorObject.error || "Failed to fetch purchase orders");
  }

  return result.json();
};