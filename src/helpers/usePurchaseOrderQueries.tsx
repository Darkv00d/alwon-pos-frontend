import { useQuery } from "@tanstack/react-query";
import { getPurchaseOrders } from "../endpoints/purchase-orders_GET.schema";

export const PURCHASE_ORDERS_QUERY_KEY = "purchaseOrders";

export const usePurchaseOrdersQuery = () => {
  return useQuery({
    queryKey: [PURCHASE_ORDERS_QUERY_KEY],
    queryFn: () => getPurchaseOrders(),
    select: (data) => data.purchaseOrders,
  });
};