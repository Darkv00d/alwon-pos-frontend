import { useQuery } from "@tanstack/react-query";
import { getCategories, type PublicCategory } from "../endpoints/categories_GET.schema";

export const CATEGORIES_QUERY_KEY = ["categories", "list"] as const;

/**
 * A React Query hook to fetch the hierarchical list of all product categories and their subcategories.
 * This is intended for public use, for example, in forms where a user needs to select a category.
 *
 * @returns The result of the useQuery hook, providing data, status, and error information.
 * The `data` property, on success, will be an array of `PublicCategory` objects.
 */
export const useCategoriesQuery = () => {
  return useQuery<PublicCategory[], Error>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const result = await getCategories();
      // The getCategories helper already handles non-ok responses by throwing an error.
      // We just need to return the categories array on success.
      return result.categories;
    },
    staleTime: 60 * 1000 * 5, // 5 minutes
    placeholderData: () => [],
  });
};