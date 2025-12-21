import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../endpoints/products_GET.schema";

interface UseProductsQueryOptions {
  locationIds?: number[];
}

export const useProductsQuery = (options?: UseProductsQueryOptions) => {
  const { locationIds } = options || {};

  return useQuery({
    queryKey: ["products", locationIds],
    queryFn: () => {
      const headers: Record<string, string> = {};
      
      // Add location header if locationIds are specified
      if (locationIds && locationIds.length > 0) {
        headers["X-Location-Ids"] = locationIds.join(",");
      }
      
      return getProducts({
        headers: headers,
      });
    },
    placeholderData: (previousData) => previousData,
  });
};