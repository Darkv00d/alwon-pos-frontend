import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useAuth, AUTH_QUERY_KEY } from "./useAuth";

// --- Constants and Types ---

const LOCATION_STORAGE_KEY = "selectedLocationIds";
const POS_EQUIPMENT_STORAGE_KEY = "selectedPosEquipmentIds";
const DATE_RANGE_STORAGE_KEY = "selectedDateRange";

const LOCATION_CHANGE_EVENT = "onLocationChange";
const POS_EQUIPMENT_CHANGE_EVENT = "onPosEquipmentChange";
const DATE_RANGE_CHANGE_EVENT = "onDateRangeChange";

export type DateRange = { from: string; to: string } | null;

// --- Location Selection ---

/**
 * Retrieves the selected location IDs from localStorage.
 * @returns An array of location IDs, or an empty array if none are set.
 */
export const getSelectedLocations = (): number[] => {
  try {
    const storedValue = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse selected locations from localStorage", error);
  }
  return [];
};

/**
 * Stores the selected location IDs in localStorage and notifies other parts of the app.
 * @param locationIds An array of location IDs to store.
 */
export const setSelectedLocations = (locationIds: number[]): void => {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationIds));
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: locationIds }));
  } catch (error) {
    console.error("Failed to set selected locations in localStorage", error);
  }
};

/**
 * A React hook to manage and subscribe to the globally selected location IDs.
 * The state is synchronized with localStorage and across all components using this hook.
 * @returns A tuple containing the current array of selected location IDs and a function to update them.
 */
export const useSelectedLocations = (): [number[], (locationIds: number[]) => void] => {
  const [locations, setLocations] = useState<number[]>(getSelectedLocations);

  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        setLocations(event.detail);
      }
    };

    window.addEventListener(LOCATION_CHANGE_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleStorageChange);
    };
  }, []);

  return [locations, setSelectedLocations];
};

// --- POS Equipment Selection ---

/**
 * Retrieves the selected POS equipment IDs from localStorage.
 * @returns An array of POS equipment IDs, or an empty array if none are set.
 */
export const getSelectedPosEquipment = (): number[] => {
  try {
    const storedValue = localStorage.getItem(POS_EQUIPMENT_STORAGE_KEY);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse selected POS equipment from localStorage", error);
  }
  return [];
};

/**
 * Stores the selected POS equipment IDs in localStorage and notifies other parts of the app.
 * @param posEquipmentIds An array of POS equipment IDs to store.
 */
export const setSelectedPosEquipment = (posEquipmentIds: number[]): void => {
  try {
    localStorage.setItem(POS_EQUIPMENT_STORAGE_KEY, JSON.stringify(posEquipmentIds));
    window.dispatchEvent(new CustomEvent(POS_EQUIPMENT_CHANGE_EVENT, { detail: posEquipmentIds }));
  } catch (error) {
    console.error("Failed to set selected POS equipment in localStorage", error);
  }
};

/**
 * A React hook to manage and subscribe to the globally selected POS equipment IDs.
 * The state is synchronized with localStorage and across all components using this hook.
 * This works in conjunction with location selection to support hierarchical filtering.
 * @returns A tuple containing the current array of selected POS equipment IDs and a function to update them.
 */
export const useSelectedPosEquipment = (): [number[], (posEquipmentIds: number[]) => void] => {
  const [posEquipment, setPosEquipment] = useState<number[]>(getSelectedPosEquipment);

  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        setPosEquipment(event.detail);
      }
    };

    window.addEventListener(POS_EQUIPMENT_CHANGE_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener(POS_EQUIPMENT_CHANGE_EVENT, handleStorageChange);
    };
  }, []);

  return [posEquipment, setSelectedPosEquipment];
};

// --- Date Range Selection ---

/**
 * Retrieves the selected date range from localStorage.
 * @returns A date range object { from, to } or null if none is set.
 */
export const getDateRange = (): DateRange => {
  try {
    const storedValue = localStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      if (parsed && typeof parsed.from === 'string' && typeof parsed.to === 'string') {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse date range from localStorage", error);
  }
  return null;
};

/**
 * Stores the selected date range in localStorage and notifies other parts of the app.
 * @param range A date range object { from, to } or null to clear it.
 */
export const setDateRange = (range: DateRange): void => {
  try {
    if (range) {
      localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify(range));
    } else {
      localStorage.removeItem(DATE_RANGE_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(DATE_RANGE_CHANGE_EVENT, { detail: range }));
  } catch (error) {
    console.error("Failed to set date range in localStorage", error);
  }
};

/**
 * A React hook to manage and subscribe to the globally selected date range.
 * The state is synchronized with localStorage and across all components using this hook.
 * @returns A tuple containing the current date range object (or null) and a function to update it.
 */
export const useDateRange = (): [DateRange, (range: DateRange) => void] => {
  const [dateRange, setDateRangeState] = useState<DateRange>(getDateRange);

  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        setDateRangeState(event.detail);
      }
    };

    window.addEventListener(DATE_RANGE_CHANGE_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener(DATE_RANGE_CHANGE_EVENT, handleStorageChange);
    };
  }, []);

  return [dateRange, setDateRange];
};


// --- Enhanced API Query Hook ---

type EnhancedKey<TBase extends QueryKey> = [...TBase, { locations: string; posEquipment: string; dateRange: DateRange }];

type UseApiQueryOptions<TQueryFnData, TError, TData, TBase extends QueryKey> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, EnhancedKey<TBase>>,
  'queryKey' | 'queryFn'
>;

/**
 * An enhanced wrapper around React Query's `useQuery` that automatically includes
 * authentication state, selected location IDs, POS equipment IDs, and date range in the query.
 *
 * It handles:
 * - Disabling the query until the user is authenticated.
 * - Automatically adding `X-Location-Ids` header based on global location selection.
 * - Automatically adding `X-PosEquipment-Ids` header based on global POS equipment selection.
 * - Automatically adding `from` and `to` URL search parameters from global date selection.
 * - Adding the selected locations, POS equipment, and date range to the query key for automatic refetching.
 * - Hierarchical filtering: supports filtering by locations only, POS equipment only, or both.
 *
 * @param queryKey The base query key. Location, POS equipment, and date range will be appended.
 * @param queryFn The async query function. It receives an `init` object with pre-configured headers.
 * @param options Standard `useQuery` options.
 */
export const useApiQuery = <
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TBase extends QueryKey = QueryKey
>(
  queryKey: TBase,
  queryFn: (init: RequestInit) => Promise<TQueryFnData>,
  options?: UseApiQueryOptions<TQueryFnData, TError, TData, TBase>
) => {
  const { authState } = useAuth();
  const [locations] = useSelectedLocations();
  const [posEquipment] = useSelectedPosEquipment();
  const [dateRange] = useDateRange();
  const queryClient = useQueryClient();

  const isEnabled = authState.type === "authenticated" && (options?.enabled ?? true);

  const enhancedQueryKey: EnhancedKey<TBase> = [...queryKey, { 
    locations: locations.join(","), 
    posEquipment: posEquipment.join(","),
    dateRange 
  }];

  const enhancedQueryFn = useCallback(async () => {
    const headers = new Headers();
    
    // Add location header if locations are selected
    if (locations.length > 0) {
      headers.append("X-Location-Ids", locations.join(","));
    }

    // Add POS equipment header if equipment is selected
    if (posEquipment.length > 0) {
      headers.append("X-PosEquipment-Ids", posEquipment.join(","));
    }

    const url = new URL(window.location.href); // Base URL doesn't matter, only search params
    if (dateRange) {
      url.searchParams.set("from", dateRange.from);
      url.searchParams.set("to", dateRange.to);
    }
    
    // This is a trick to pass search params to the fetch call inside queryFn
    // The actual endpoint URL is determined inside the queryFn itself.
    const searchString = url.searchParams.toString();

    const init: RequestInit = { headers };

    // The queryFn is expected to append the searchString to its fetch URL
    // e.g., fetch(`/_api/my-endpoint?${searchString}`, init)
    // We pass it as part of the init object for clarity.
    // @ts-ignore - extending RequestInit for internal use
    init.searchString = searchString;

    return queryFn(init);
  }, [queryFn, locations, posEquipment, dateRange]);

  // When user logs out, we don't want to keep stale data from a previous user
  // that might have had different location permissions.
  useEffect(() => {
    if (authState.type === 'unauthenticated') {
      queryClient.removeQueries({ queryKey: enhancedQueryKey });
    }
  }, [authState.type, queryClient, enhancedQueryKey]);

  return useQuery<TQueryFnData, TError, TData, EnhancedKey<TBase>>({
    ...options,
    queryKey: enhancedQueryKey,
    queryFn: enhancedQueryFn,
    enabled: isEnabled,
  });
};