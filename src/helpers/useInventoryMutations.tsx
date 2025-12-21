import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postStockMovements, type InputType as CreateStockMovementInput } from "../endpoints/stock-movements_POST.schema";
import { postProductLots, type InputType as CreateOrUpdateLotInput } from "../endpoints/product-lots_POST.schema";

/**
 * Custom hook for creating a new stock movement.
 * On success, it invalidates queries for stock movements, products, and product lots
 * to ensure the UI reflects the latest inventory state.
 */
export const useCreateStockMovementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newMovement: CreateStockMovementInput) => postStockMovements(newMovement),
    onSuccess: (data) => {
      toast.success(`Stock movement (${data.type}) recorded successfully!`);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stockMovements"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["productLots"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error creating stock movement:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to record movement: ${errorMessage}`);
    },
  });
};

/**
 * Custom hook for creating or updating a product lot.
 * On success, it invalidates the "productLots" query to refetch the lot list.
 */
export const useCreateOrUpdateLotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lotData: CreateOrUpdateLotInput) => postProductLots(lotData),
    onSuccess: (data, variables) => {
      const action = variables.id ? "updated" : "created";
      toast.success(`Product lot ${action} successfully!`);
      return queryClient.invalidateQueries({ queryKey: ["productLots"] });
    },
    onError: (error) => {
      console.error("Error processing product lot:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to process lot: ${errorMessage}`);
    },
  });
};