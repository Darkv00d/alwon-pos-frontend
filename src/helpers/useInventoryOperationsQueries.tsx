import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  postAdminInventoryAdjust, 
  type InputType as AdjustInventoryInput 
} from "../endpoints/admin/inventory/adjust_POST.schema";
import { 
  postAdminInventoryTransfer, 
  type InputType as TransferInventoryInput 
} from "../endpoints/admin/inventory/transfer_POST.schema";
import { 
  getAdminInventoryKardex, 
  type InputType as KardexInput, 
  type OutputType as KardexOutput 
} from "../endpoints/admin/inventory/kardex_GET.schema";

export const KARDEX_QUERY_KEY = "kardex";

/**
 * Mutation hook for adjusting inventory quantities.
 * On success, it invalidates the kardex (stock movements) and products queries
 * to ensure the UI reflects the latest inventory state.
 */
export const useAdjustInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adjustmentData: AdjustInventoryInput) => {
      // The endpoint requires the locationId to be in the headers, not the body.
      // We assume the calling component will use a fetch interceptor or similar
      // to inject the X-Location-Id header from a global state (e.g., context).
      return postAdminInventoryAdjust(adjustmentData);
    },
    onSuccess: () => {
      toast.success("Inventory adjustment recorded successfully!");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [KARDEX_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error creating inventory adjustment:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to record adjustment: ${errorMessage}`);
    },
  });
};

/**
 * Mutation hook for transferring inventory between locations.
 * On success, it invalidates the kardex (stock movements) query.
 */
export const useTransferInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferData: TransferInventoryInput) => postAdminInventoryTransfer(transferData),
    onSuccess: (data) => {
      toast.success(`Inventory transferred successfully! Reference: ${data.reference}`);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [KARDEX_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ["stockMovements"] }),
        queryClient.invalidateQueries({ queryKey: ["stockAvailable"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error creating inventory transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create transfer: ${errorMessage}`);
    },
  });
};

/**
 * Query hook for fetching the inventory Kardex (movement history).
 * @param filters - Optional filters for product, location, and date range.
 * @param options - Optional React Query options.
 */
export const useKardexQuery = (
  filters: KardexInput,
  options?: Omit<UseQueryOptions<KardexOutput>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<KardexOutput>({
    queryKey: [KARDEX_QUERY_KEY, filters],
    queryFn: () => getAdminInventoryKardex(filters),
    ...options,
  });
};