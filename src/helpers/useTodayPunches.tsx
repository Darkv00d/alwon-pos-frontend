import { useApiQuery } from './locationSelection';
import { getTimeclockPunchesToday } from '../endpoints/timeclock/punches/today_GET.schema';

/**
 * The base query key for fetching today's time clock punches.
 * The final query key will be enhanced by useApiQuery to include location and date range.
 */
export const TODAY_PUNCHES_QUERY_KEY = ['timeclock', 'punches', 'today'] as const;

/**
 * A React Query hook to fetch today's time clock punches with real-time updates.
 *
 * This hook seamlessly integrates with the global location selection system provided by `locationSelection.tsx`.
 *
 * Features:
 * - **Automatic Location Filtering**: It uses `useApiQuery` to automatically include the
 *   globally selected location IDs in the `X-Location-Ids` header of the API request.
 * - **Authentication-Aware**: The query is automatically disabled until a user is authenticated.
 * - **Real-time Updates**: The data is refetched every 30 seconds to keep the UI up-to-date
 *   with the latest punches.
 * - **Automatic Caching**: The query key is managed by `useApiQuery`, ensuring that data is
 *   automatically refetched and cached correctly whenever the selected locations change.
 * - **Zero Configuration**: No parameters are needed; the hook works out-of-the-box with the
 *   global state.
 *
 * @returns The result of the `useQuery` call from React Query, including `data`, `isFetching`, `error`, etc.
 *          The `data` property will contain the `OutputType` from the endpoint, which is `{ punches: TimeClockPunch[] }`.
 */
export const useTodayPunches = () => {
  return useApiQuery(
    TODAY_PUNCHES_QUERY_KEY,
    // useApiQuery passes an `init` object with pre-configured headers (like X-Location-Ids)
    // which we pass directly to our endpoint fetcher.
    (init) => getTimeclockPunchesToday(init),
    {
      // Refetch every 30 seconds to provide a near real-time view of time clock activity.
      refetchInterval: 30000,
      // Consider data stale after 30 seconds, prompting a refetch on component mount if needed.
      staleTime: 30000,
    }
  );
};