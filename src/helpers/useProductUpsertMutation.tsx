import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postProductsUpsert,
  type InputType as ProductUpsertInput,
} from "../endpoints/products/upsert_POST.schema";

/**
 * Custom hook for creating or updating a product using a single upsert endpoint.
 * It uses React Query's useMutation to handle the API call.
 *
 * - If the input data contains an `id`, it performs an update.
 * - If the input data does not contain an `id`, it performs a create.
 *
 * On success, it invalidates all queries under the "products" key to ensure that
 * both product lists and individual product details are refetched and kept up-to-date.
 * It provides clear user feedback through toast notifications for both success and error scenarios.
 */
export const useProductUpsertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: ProductUpsertInput) =>
      postProductsUpsert(productData),

    onSuccess: (data, variables) => {
      // The 'variables' argument holds the input sent to the mutationFn.
      // We use it to determine if the operation was a create or an update.
      const action = variables.id ? "updated" : "created";
      
      if (data.ok) {
        toast.success(`Product "${data.product.name}" ${action} successfully!`);
        // Invalidate all queries starting with "products" to refetch lists and details.
        // This is a broad invalidation to cover any view that might display product data.
        return queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        // Handle cases where the API returns a success status code but a logical error.
        const errorMessage = data.error || `Failed to ${action} product.`;
        toast.error(errorMessage);
        console.error(`Error ${action} product:`, data.error);
      }
    },

    onError: (error, variables) => {
      const action = variables.id ? "update" : "create";
      console.error(`Error trying to ${action} product:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to ${action} product: ${errorMessage}`);
    },
  });
};