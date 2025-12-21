import { useQuery } from "@tanstack/react-query";
import { getAdminReportsSalesByLocation } from "../endpoints/admin/reports/sales_by_location_GET.schema";

type SalesByLocationReportParams = {
  startDate?: Date;
  endDate?: Date;
  locationIds?: number[];
};

/**
 * React Query hook to fetch the sales by location report.
 *
 * @param params - The filter parameters for the report.
 * @param params.startDate - Optional start date for the report period.
 * @param params.endDate - Optional end date for the report period.
 * @param params.locationIds - Optional array of IDs to filter by specific locations.
 * @returns A TanStack Query object for the sales by location report.
 */
export function useSalesByLocationReport(params: SalesByLocationReportParams) {
  const queryKey = ["admin", "reports", "sales-by-location", params] as const;

  return useQuery({
    queryKey,
    queryFn: () => getAdminReportsSalesByLocation(params),
    placeholderData: (previousData) => previousData,
  });
}