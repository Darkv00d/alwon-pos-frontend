import { useQuery } from "@tanstack/react-query";
import { getProductsList } from "../endpoints/products/list_GET.schema";

/**
 * The query key for the products list.
 * Can be used to invalidate the query from mutations.
 * e.g., queryClient.invalidateQueries({ queryKey: PRODUCTS_LIST_QUERY_KEY })
 */
export const PRODUCTS_LIST_QUERY_KEY = ["products", "list"] as const;

/**
 * A React Query hook to fetch a list of products, with optional search functionality.
 *
 * @param searchQuery - An optional string to filter products by name, SKU, or barcode.
 * @returns The result of the useQuery hook, including the product list data, loading states, and error information.
 */
export const useProductsListQuery = (searchQuery?: string) => {
  const queryKey = [
    ...PRODUCTS_LIST_QUERY_KEY,
    { search: searchQuery ?? "" },
  ];

  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const result = await getProductsList({ q: searchQuery });
      // The helper function already throws on error, but we can double-check.
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result;
    },
    placeholderData: (previousData) => previousData,
  });
};