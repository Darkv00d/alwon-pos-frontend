import { useAuth } from './useAuth';
import { useApiQuery, useDateRange } from './locationSelection';
import { getAdminReportsSalesSummary, SalesSummaryItem } from '../endpoints/admin/reports/sales_summary_GET.schema';
import { getAdminReportsTopProducts, TopProductItem } from '../endpoints/admin/reports/top_products_GET.schema';
import { useTodayPunches } from './useTodayPunches';
import { TimeClockPunch } from '../endpoints/timeclock/punches/today_GET.schema';

// --- Query Keys ---

const SALES_SUMMARY_QUERY_KEY = ['admin', 'reports', 'salesSummary'] as const;
const TOP_PRODUCTS_QUERY_KEY = ['admin', 'reports', 'topProducts'] as const;

// --- Individual Report Hooks ---

/**
 * Fetches the sales summary report.
 * This hook is admin-only and integrates with global location and date range filters.
 */
const useSalesSummaryReport = () => {
  const { authState } = useAuth();
  const [dateRange] = useDateRange();

  const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

  return useApiQuery(
    SALES_SUMMARY_QUERY_KEY,
    async (init) => {
      // The useApiQuery hook doesn't directly pass date filters to the fetcher function.
      // The endpoint schema helper needs them explicitly.
      // We get them from the useDateRange hook.
      const from = dateRange?.from ? new Date(dateRange.from) : undefined;
      const to = dateRange?.to ? new Date(dateRange.to) : undefined;
      
      // The locationIds are handled automatically by useApiQuery via headers.
      return getAdminReportsSalesSummary({ from, to }, init);
    },
    {
      enabled: isAdmin,
      select: (data) => data.summary,
    }
  );
};

/**
 * Fetches the top 10 selling products by revenue.
 * This hook is admin-only and integrates with global location and date range filters.
 */
const useTopProductsReport = () => {
  const { authState } = useAuth();
  const [dateRange] = useDateRange();

  const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

  return useApiQuery(
    TOP_PRODUCTS_QUERY_KEY,
    async (init) => {
      const from = dateRange?.from ? new Date(dateRange.from) : undefined;
      const to = dateRange?.to ? new Date(dateRange.to) : undefined;
      
      // The locationIds are handled automatically by useApiQuery via headers.
      return getAdminReportsTopProducts({ from, to }, init);
    },
    {
      enabled: isAdmin,
      select: (data) => data.items,
    }
  );
};

/**
 * A wrapper around useTodayPunches that ensures it's only enabled for admin users
 * in the context of the dashboard.
 */
const useAdminTodayPunches = () => {
    const { authState } = useAuth();
    const punchesQuery = useTodayPunches();
    const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

    return {
        ...punchesQuery,
        // Override the enabled status based on admin role
        isFetching: !isAdmin ? false : punchesQuery.isFetching,
        data: !isAdmin ? undefined : punchesQuery.data,
    };
};


// --- Combined Dashboard Hook ---

export type DashboardReports = {
  salesSummary: {
    data: SalesSummaryItem[] | undefined;
    isFetching: boolean;
    error: Error | null;
  };
  topProducts: {
    data: TopProductItem[] | undefined;
    isFetching: boolean;
    error: Error | null;
  };
  todayPunches: {
    data: TimeClockPunch[] | undefined;
    isFetching: boolean;
    error: Error | null;
  };
  isFetchingAny: boolean;
  hasError: boolean;
};

/**
 * A comprehensive hook that combines all necessary data queries for the admin dashboard.
 * It provides sales summary, top products, and today's time clock punches,
 * all automatically filtered by the globally selected locations and date range.
 *
 * All queries are restricted to users with the 'admin' role.
 *
 * @returns An object containing the data, loading, and error states for each report,
 *          plus aggregate loading and error flags.
 */
export const useDashboardReports = (): DashboardReports => {
  const salesSummary = useSalesSummaryReport();
  const topProducts = useTopProductsReport();
  const todayPunchesQuery = useAdminTodayPunches();

  return {
    salesSummary: {
      data: salesSummary.data,
      isFetching: salesSummary.isFetching,
      error: salesSummary.error as Error | null,
    },
    topProducts: {
      data: topProducts.data,
      isFetching: topProducts.isFetching,
      error: topProducts.error as Error | null,
    },
    todayPunches: {
      data: todayPunchesQuery.data?.punches,
      isFetching: todayPunchesQuery.isFetching,
      error: todayPunchesQuery.error as Error | null,
    },
    isFetchingAny: salesSummary.isFetching || topProducts.isFetching || todayPunchesQuery.isFetching,
    hasError: !!salesSummary.error || !!topProducts.error || !!todayPunchesQuery.error,
  };
};