import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postKioskTransactions, type InputType } from "../endpoints/kiosk/transactions_POST.schema";

interface KioskTransactionVariables {
  transaction: InputType;
  locationId: number;
}

/**
 * A React Query hook for creating a new transaction from a public kiosk.
 * It uses the unauthenticated `kiosk/transactions_POST` endpoint.
 *
 * @returns A React Query mutation object for kiosk transactions.
 */
export const useKioskTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transaction, locationId }: KioskTransactionVariables) => {
      if (!locationId) {
        throw new Error("locationId is required to process a kiosk transaction.");
      }
      
      const headers: Record<string, string> = {
        "X-Location-Id": locationId.toString(),
      };
      
      return postKioskTransactions(transaction, { headers });
    },
    onSuccess: () => {
      // After a successful transaction, invalidate the top-level "products" query key.
      // This will cause both useKioskProductsQuery and useProductsQuery to refetch,
      // ensuring that stock quantities are updated across the entire application.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      // Also invalidate customer queries to update points balances if a customer was associated.
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerPointsTransactions"] });
    },
  });
};