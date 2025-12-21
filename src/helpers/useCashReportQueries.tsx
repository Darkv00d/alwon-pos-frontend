import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getCashReport, InputType, OutputType } from "../endpoints/pos/cash-report_GET.schema";

/**
 * A query key constant for cash reports to be used for invalidation.
 */
export const CASH_REPORT_QUERY_KEY = ["cashReport"] as const;

/**
 * The type of the cash report object after being transformed to be compatible
 * with the `CashReportView` component.
 */
export type MappedCashReport = {
  sessionId: string | null;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransactions: number;
  movementsIn: number;
  movementsOut: number;
};

/**
 * A React Query hook to fetch a cash report, either for a specific session or for an entire day.
 * It handles loading and error states and transforms the API response to be compatible with
 * the `CashReportView` component.
 *
 * @param params - An object containing either a `sessionId` or a `date` (in 'YYYY-MM-DD' format).
 * @returns A `UseQueryResult` object from React Query containing the report data, loading state, and error information.
 */
export const useCashReportQuery = (
  params: InputType
): UseQueryResult<MappedCashReport, Error> => {
  const queryKey = [CASH_REPORT_QUERY_KEY[0], params];

  return useQuery<OutputType, Error, MappedCashReport>({
    queryKey,
    queryFn: () => getCashReport(params),
    // The `select` function transforms the data from the API to match the format
    // expected by the `CashReportView` component.
    select: (data) => {
      // Handle daily aggregated reports
      if (data.date && data.period) {
        return {
          ...data,
          sessionId: null, // Daily reports don't have a single session ID
          openedAt: data.period.start,
          closedAt: data.period.end,
        };
      }

      // Handle single session reports
      if (data.sessionId && data.openedAt) {
        return {
          ...data,
          sessionId: data.sessionId,
          openedAt: data.openedAt,
          closedAt: data.closedAt ?? null,
        };
      }

      // This case should ideally not be reached if the API is consistent.
      // It provides a safe fallback.
      console.error("Inconsistent cash report data received:", data);
      throw new Error("Inconsistent cash report data received from API.");
    },
    // Only run the query if either sessionId or date is provided.
    enabled: !!params.sessionId || !!params.date,
  });
};

/**
 * A hook that provides a function to invalidate all cash report queries.
 * This is useful for forcing a refetch of report data after a related action,
 * such as closing a cash session.
 *
 * @returns An object containing the `invalidateCashReports` function.
 */
export const useInvalidateCashReports = () => {
  const queryClient = useQueryClient();

  const invalidateCashReports = () => {
    console.log("Invalidating all cash report queries...");
    return queryClient.invalidateQueries({ queryKey: CASH_REPORT_QUERY_KEY });
  };

  return { invalidateCashReports };
};