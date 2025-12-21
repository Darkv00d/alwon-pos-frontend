import { useApiQuery } from "./locationSelection";
import {
  getTransactionsSummary,
  OutputType,
} from "../endpoints/transactions/summary_GET.schema";

export const TRANSACTIONS_SUMMARY_QUERY_KEY = "transactionsSummary" as const;

export const useTransactionsSummary = (
  options?: { enabled?: boolean }
) => {
  return useApiQuery<OutputType>(
    [TRANSACTIONS_SUMMARY_QUERY_KEY],
    async (init) => {
      // Extract search parameters that useApiQuery automatically adds
      // @ts-ignore - searchString is added by useApiQuery for internal use
      const searchString = init.searchString || "";
      
      // Parse the search parameters to construct the query object
      const searchParams = new URLSearchParams(searchString);
      const filters = {
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
        locationIds: undefined, // locationIds are handled via X-Location-Ids header
      };

      return getTransactionsSummary(filters, init);
    },
    options
  );
};