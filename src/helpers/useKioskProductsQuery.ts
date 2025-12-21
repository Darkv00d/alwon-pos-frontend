import { useQuery } from "@tanstack/react-query";
import { getKioskProducts } from "../endpoints/kiosk/products_GET.schema";

interface UseKioskProductsQueryOptions {
  locationId?: number;
  search?: string;
}

/**
 * A React Query hook to fetch products for a public kiosk.
 * It uses the unauthenticated `kiosk/products_GET` endpoint.
 *
 * @param options - Optional configuration.
 * @param options.locationId - The ID of the kiosk location to filter products for.
 * @param options.search - Optional search query to filter products by name and barcode.
 * @returns A React Query result object for the kiosk products query.
 */
export const useKioskProductsQuery = (options?: UseKioskProductsQueryOptions) => {
  const { locationId, search } = options || {};

  // The query key includes "kiosk", locationId, and search to ensure data is
  // cached correctly and refetched when parameters change, without
  // conflicting with the authenticated products query.
  return useQuery({
    queryKey: ["products", "kiosk", { locationId, search }],
    queryFn: () => {
      const headers: Record<string, string> = {};
      
      if (locationId) {
        headers["X-Location-Id"] = locationId.toString();
      }
      
      const params = search ? { q: search } : undefined;
      
      return getKioskProducts(params, {
        headers: headers,
      });
    },
    placeholderData: (previousData) => previousData,
  });
};