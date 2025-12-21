import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postSuppliers,
  type InputType as CreateInput,
} from "../endpoints/suppliers_POST.schema";
import {
  postSuppliersUpdate,
  type InputType as UpdateInput,
} from "../endpoints/suppliers/update_POST.schema";
import {
  postSuppliersDelete,
  type InputType as DeleteInput,
} from "../endpoints/suppliers/delete_POST.schema";
import { SUPPLIERS_QUERY_KEY } from "./useSupplierQueries";
import { toast } from "sonner";

export const useCreateSupplierMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSupplier: CreateInput) => postSuppliers(newSupplier),
    onSuccess: () => {
      toast.success("Supplier created successfully!");
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });
};

export const useUpdateSupplierMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedSupplier: UpdateInput) =>
      postSuppliersUpdate(updatedSupplier),
    onSuccess: () => {
      toast.success("Supplier updated successfully!");
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
};

export const useDeleteSupplierMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplier: DeleteInput) => postSuppliersDelete(supplier),
    onSuccess: () => {
      toast.success("Supplier deleted successfully!");
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
};