import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminCategoriesList } from "../endpoints/admin/categories-list_GET.schema";
import { postAdminCategoriesUpsert, InputType as PostCategoriesInput } from "../endpoints/admin/categories_upsert_POST.schema";
import { toast } from "sonner";

export const ADMIN_CATEGORIES_LIST_QUERY_KEY = ["admin", "categories-list"];

/**
 * Fetches the complete hierarchical list of categories and their subcategories.
 */
export const useAdminCategoriesListQuery = () => {
  return useQuery({
    queryKey: ADMIN_CATEGORIES_LIST_QUERY_KEY,
    queryFn: getAdminCategoriesList,
  });
};

/**
 * Provides a mutation for creating or updating categories and subcategories.
 * It handles success and error notifications and invalidates the categories list query
 * to ensure the UI is updated with the latest data.
 */
export const useAdminCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostCategoriesInput) => postAdminCategoriesUpsert(data),
    onSuccess: (data) => {
      toast.success(data.message || "Category saved successfully!");
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_LIST_QUERY_KEY });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to save category: ${errorMessage}`);
      console.error("Category mutation error:", error);
    },
  });
};