import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminInventoryStock, type StockLevel } from "../endpoints/admin/inventory/stock_GET.schema";

type UseInventoryStockQueryOptions = {
  productId?: number;
  locationIds?: number[];
};

export const INVENTORY_STOCK_QUERY_KEY = "adminInventoryStock";

/**
 * A React Query hook to fetch inventory stock levels.
 *
 * @param options - Optional filters for the query.
 * @param options.productId - Filter stock by a specific product ID.
 * @param options.locationIds - Filter stock by a list of location IDs.
 * @returns The result of the useQuery hook.
 */
export const useInventoryStockQuery = (options?: UseInventoryStockQueryOptions) => {
  const queryKey = [INVENTORY_STOCK_QUERY_KEY, options ?? {}];

  return useQuery<StockLevel[], Error>({
    queryKey,
    queryFn: async () => {
      const params = {
        productId: options?.productId,
        locationIds: options?.locationIds?.join(','),
      };
      
      const result = await getAdminInventoryStock(params);

      if (result.ok) {
        return result.stock;
      }
      
      // The getInventoryStock helper throws an error on failure, but we handle the error type explicitly here for robustness.
      throw new Error(result.error || "An unknown error occurred while fetching stock levels.");
    },
    placeholderData: (previousData) => previousData,
  });
};

/**
 * A helper hook that provides a function to invalidate inventory stock queries.
 * This is useful after performing a stock movement mutation.
 *
 * @returns An object containing the `invalidateStockQueries` function.
 */
export const useInvalidateInventoryStock = () => {
  const queryClient = useQueryClient();

  const invalidateStockQueries = () => {
    console.log("Invalidating admin inventory stock queries...");
    return queryClient.invalidateQueries({ queryKey: [INVENTORY_STOCK_QUERY_KEY] });
  };

  return { invalidateStockQueries };
};