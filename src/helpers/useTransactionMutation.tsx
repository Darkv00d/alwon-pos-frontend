import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTransactions, type InputType } from "../endpoints/transactions_POST.schema";

export const useTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTransaction: InputType) => postTransactions(newTransaction),
    onSuccess: () => {
      // After a successful transaction, invalidate the products query
      // to refetch the updated stock quantities.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      // Also invalidate customer queries to update points balances
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerPointsTransactions"] });
    },
    // You can add onError and onSettled handlers here if needed
  });
};