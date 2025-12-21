import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLocations } from "../endpoints/locations_GET.schema";
import { postAdminInventoryLocationsUpsert, type InputType as LocationUpsertInput } from "../endpoints/admin/inventory-locations/upsert_POST.schema";
import { toast } from "sonner";
import { type LocationType } from "./schema";
import { useMemo } from "react";

/**
 * React Query key for physical locations.
 */
export const LOCATIONS_QUERY_KEY = ["locations"];

type UseLocationsQueryFilters = {
  locationType?: LocationType | LocationType[];
  isActive?: boolean;
};

/**
 * Fetches a list of all physical locations, with optional client-side filtering.
 *
 * @param filters - Optional filters for locationType and isActive status.
 */
export const useLocationsQuery = (filters: UseLocationsQueryFilters = {}) => {
  const { locationType, isActive } = filters;

  return useQuery({
    queryKey: [...LOCATIONS_QUERY_KEY, filters],
    queryFn: getLocations,
    select: (data) => {
      let filteredData = data;

      if (isActive !== undefined) {
        filteredData = filteredData.filter(location => location.isActive === isActive);
      }

      if (locationType) {
        const types = Array.isArray(locationType) ? locationType : [locationType];
        if (types.length > 0) {
          filteredData = filteredData.filter(location => types.includes(location.locationType));
        }
      }
      
      return filteredData;
    },
  });
};

/**
 * A convenience hook that fetches only active locations.
 * Useful for populating dropdowns and selectors where inactive locations are not needed.
 */
export const useActiveLocationsQuery = () => {
  const { data, ...rest } = useLocationsQuery({ isActive: true });
  
  const activeLocations = useMemo(() => data ?? [], [data]);

  return { data: activeLocations, ...rest };
};


/**
 * Provides a mutation for creating or updating a physical location.
 * It handles optimistic updates and invalidates the locations query on success.
 */
export const useLocationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationData: LocationUpsertInput) => postAdminInventoryLocationsUpsert(locationData),
    onSuccess: (data) => {
      toast.success(data.message || "Location saved successfully.");
      // Invalidate all queries related to locations to refetch fresh data
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while saving the location.";
      toast.error(errorMessage);
      console.error("Location mutation failed:", error);
    },
  });
};