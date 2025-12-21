import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postProducts,
  type InputType as CreateProductInput,
} from "../endpoints/products_POST.schema";
import {
  postProductsUpdate,
  type InputType as UpdateProductInput,
} from "../endpoints/products/update_POST.schema";
import { toast } from "sonner";

/**
 * Custom hook for creating a new product.
 * It uses React Query's useMutation to handle the API call.
 * On success, it invalidates the "products" query to refetch the product list
 * and shows a success toast. On error, it logs the error and shows an error toast.
 */
export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProduct: CreateProductInput) => postProducts(newProduct),
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" created successfully!`);
      // Invalidate and refetch the products query to include the new product
      return queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create product: ${errorMessage}`);
    },
  });
};

/**
 * Custom hook for updating an existing product.
 * It uses React Query's useMutation to handle the API call.
 * On success, it invalidates the "products" query to reflect the changes
 * and shows a success toast. On error, it logs the error and shows an error toast.
 */
export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedProduct: UpdateProductInput) =>
      postProductsUpdate(updatedProduct),
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" updated successfully!`);
      // Invalidate and refetch the products query to show the updated product data
      return queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update product: ${errorMessage}`);
    },
  });
};