import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postPurchaseOrder,
  type InputType as CreatePOInput,
} from "../endpoints/purchase-orders_POST.schema";
import {
  postUpdatePurchaseOrder,
  type InputType as UpdatePOInput,
} from "../endpoints/purchase-orders/update_POST.schema";
import { postAutoGeneratePurchaseOrders } from "../endpoints/purchase-orders/auto-generate_POST.schema";
import { PURCHASE_ORDERS_QUERY_KEY } from "./usePurchaseOrderQueries";

export const useCreatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePOInput) => postPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_QUERY_KEY] });
    },
  });
};

export const useUpdatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePOInput) => postUpdatePurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_QUERY_KEY] });
      // Also invalidate products query as stock levels might change
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useAutoGeneratePurchaseOrdersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postAutoGeneratePurchaseOrders(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_QUERY_KEY] });
    },
  });
};