import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { 
  getAdminInventoryLocationsList, 
  type InputType as ListInputType,
  type OutputType as ListOutputType
} from "../endpoints/admin/inventory-locations/list_GET.schema";
import { 
  postAdminInventoryLocationsUpsert, 
  type InputType as UpsertInputType 
} from "../endpoints/admin/inventory-locations/upsert_POST.schema";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

/**
 * React Query key for inventory locations.
 */
export const INVENTORY_LOCATIONS_QUERY_KEY = ["admin", "inventory-locations"];

/**
 * Fetches a paginated and filtered list of inventory locations.
 *
 * @param params - Filters, pagination, and sorting options.
 * @param options - React Query options.
 */
export const useInventoryLocationsQuery = (
  params: ListInputType,
  options?: Omit<UseQueryOptions<ListOutputType>, 'queryKey' | 'queryFn'>
) => {
  const [debouncedParams] = useDebounce(params, 300);

  return useQuery({
    queryKey: [...INVENTORY_LOCATIONS_QUERY_KEY, debouncedParams],
    queryFn: () => getAdminInventoryLocationsList(debouncedParams),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

/**
 * Provides a mutation for creating or updating an inventory location.
 * It handles optimistic updates and invalidates the locations list query on success.
 */
export const useInventoryLocationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationData: UpsertInputType) => postAdminInventoryLocationsUpsert(locationData),
    onSuccess: (data) => {
      toast.success(data.message || "Location saved successfully.");
      // Invalidate all queries related to inventory locations to refetch fresh data
      queryClient.invalidateQueries({ queryKey: INVENTORY_LOCATIONS_QUERY_KEY });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while saving the location.";
      toast.error(errorMessage);
      console.error("Inventory location mutation failed:", error);
    },
  });
};