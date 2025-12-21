import { type PurchaseOrderDetails } from "../endpoints/admin/po/list_GET.schema";
import {
  type InputType as UpsertPOInputType,
  type OutputType as UpsertPOOutputType,
} from "../endpoints/admin/po/upsert_POST.schema";
import { type OutputType as ReceivePOOutputType } from "../endpoints/admin/po/receive_POST.schema";

type POListResponse = {
  ok: boolean;
  orders: PurchaseOrderDetails[];
};

/**
 * Fetches a list of purchase orders using cookie-based authentication.
 * @param q - Optional search query string.
 * @returns A promise that resolves to an object with `ok` status and an array of orders.
 *          On failure, returns `{ ok: false, orders: [] }`.
 */
export const poList = async (q?: string): Promise<POListResponse> => {
  const url = new URL(`/_api/admin/po/list`, window.location.origin);
  if (q) {
    url.searchParams.set("q", q);
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Failed to fetch purchase orders:",
        errorData.error || response.statusText
      );
      return { ok: false, orders: [] };
    }

    const data: { purchaseOrders: PurchaseOrderDetails[] } =
      await response.json();
    return { ok: true, orders: data.purchaseOrders };
  } catch (error) {
    console.error(
      "An unexpected error occurred while fetching purchase orders:",
      error
    );
    return { ok: false, orders: [] };
  }
};

/**
 * Creates or updates a purchase order using cookie-based authentication.
 * @param form - The purchase order data, conforming to the upsert schema.
 * @returns A promise that resolves to the upsert operation result. Throws an error on failure.
 */
export const poUpsert = async (
  form: UpsertPOInputType
): Promise<UpsertPOOutputType> => {
  const response = await fetch(`/_api/admin/po/upsert`, {
    method: "POST",
    body: JSON.stringify(form),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upsert purchase order");
  }

  return data;
};

/**
 * Marks a purchase order as received and updates stock, using cookie-based authentication.
 * @param id - The ID of the purchase order to receive.
 * @param locationId - The ID of the location receiving the stock. The backend requires this.
 * @returns A promise that resolves to the receive operation result. Throws an error on failure.
 */
export const poReceive = async (
  id: number,
  locationId?: number
): Promise<ReceivePOOutputType> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (locationId !== undefined) {
    headers["x-location-id"] = String(locationId);
  }

  const response = await fetch(`/_api/admin/po/receive`, {
    method: "POST",
    body: JSON.stringify({ id }),
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to receive purchase order");
  }

  return data;
};