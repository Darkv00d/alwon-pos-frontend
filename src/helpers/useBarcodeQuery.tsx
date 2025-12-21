import { useQuery } from "@tanstack/react-query";
import { getProductByBarcode, type InputType, type OutputType } from "../endpoints/products/by-barcode_GET.schema";

/**
 * Creates a query key for fetching a product by barcode.
 * This can be used for cache invalidation or direct cache access.
 * @param params - The barcode and optional locationId.
 * @returns A constant query key array.
 */
export const createBarcodeQueryKey = (params: InputType) => ['product', 'byBarcode', params.barcode, params.locationId] as const;

type UseBarcodeQueryParams = {
  barcode: string | null | undefined;
  locationId?: number;
};

/**
 * A React Query hook to fetch a single product by its barcode.
 * It is designed for use with barcode scanners in kiosks or other parts of the application.
 *
 * @param barcode The product barcode to search for. The query is disabled if this is null, undefined, or an empty string.
 * @param locationId Optional location ID for context.
 * @returns The result object from React Query's useQuery hook.
 */
export const useBarcodeQuery = ({ barcode, locationId }: UseBarcodeQueryParams) => {
  const trimmedBarcode = barcode?.trim();

  const query = useQuery<OutputType, Error>({
    queryKey: createBarcodeQueryKey({ barcode: trimmedBarcode || '', locationId }),
    queryFn: () => {
      // The `enabled` check ensures `trimmedBarcode` is a valid, non-empty string here.
      return getProductByBarcode({ barcode: trimmedBarcode!, locationId });
    },
    // Only enable the query if a valid barcode string is provided.
    enabled: !!trimmedBarcode && trimmedBarcode.length > 0,
    // Product data doesn't change very frequently, so we can set a longer stale time
    // to reduce unnecessary network requests.
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Do not retry if the product is not found (404), as it's an expected outcome, not a server error.
    retry: (failureCount, error) => {
      if (error.message.toLowerCase().includes("product not found")) {
        return false;
      }
      // For other errors (e.g., network issues), retry up to 2 times.
      return failureCount < 2;
    },
  });

  return query;
};