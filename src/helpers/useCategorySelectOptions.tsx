import { useMemo, useCallback } from "react";
import { useAdminCategoriesListQuery } from "./useAdminCatalogQueries";
import { type CategoryWithSubcategories } from "../endpoints/admin/categories-list_GET.schema";

export type SelectOption = {
  value: number;
  label: string;
};

/**
 * A custom hook to fetch and transform category data for use in Select components.
 * It provides memoized, formatted lists of categories and a utility function to
 * retrieve formatted subcategories for a given category.
 *
 * @returns An object containing:
 * - `categoryOptions`: A list of categories formatted for a Select component.
 * - `getSubcategoriesByCategory`: A function to get a formatted list of subcategories for a given category ID.
 * - `getCategoryById`: A function to retrieve the full data for a single category by its ID.
 * - `categories`: The raw, hierarchical list of categories and subcategories from the query.
 * - `isLoading`: Boolean indicating if the category data is currently being fetched.
 * - `isError`: Boolean indicating if there was an error fetching the data.
 */
export const useCategorySelectOptions = () => {
  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useAdminCategoriesListQuery();

  const categories = data?.categories ?? [];

  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  const getSubcategoriesByCategory = useCallback(
    (categoryId: number | string | undefined): SelectOption[] => {
      if (!categoryId || !categories) return [];
      
      const numericCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
      if (isNaN(numericCategoryId)) return [];

      const category = categories.find((c) => c.id === numericCategoryId);
      if (!category || !category.subcategories) return [];

      return category.subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
      }));
    },
    [categories]
  );

  const getCategoryById = useCallback(
    (categoryId: number | string | undefined): CategoryWithSubcategories | undefined => {
      if (!categoryId || !categories) return undefined;

      const numericCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
      if (isNaN(numericCategoryId)) return undefined;

      return categories.find((c) => c.id === numericCategoryId);
    },
    [categories]
  );

  return {
    categoryOptions,
    getSubcategoriesByCategory,
    getCategoryById,
    categories,
    isLoading: isLoading || isFetching,
    isError,
  };
};