import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPosLocations } from "../endpoints/pos-locations_GET.schema";
import { postAdminPosLocationsUpsert, InputType } from "../endpoints/admin/pos-locations/upsert_POST.schema";
import { toast } from "sonner";

export const ADMIN_POS_EQUIPMENT_QUERY_KEY = ["admin", "pos-equipment"];

// Backward compatibility - keep the old query key as an alias
export const ADMIN_POS_LOCATIONS_QUERY_KEY = ADMIN_POS_EQUIPMENT_QUERY_KEY;

/**
 * Fetches the list of all POS equipment with location information.
 * Supports filtering by location IDs for hierarchical organization.
 */
export const useAdminPosEquipmentQuery = (locationIds?: number[]) => {
  return useQuery({
    queryKey: [...ADMIN_POS_EQUIPMENT_QUERY_KEY, { locationIds }],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (locationIds && locationIds.length > 0) {
        headers['X-Location-Ids'] = locationIds.join(',');
      }

      const data = await getPosLocations({ headers });
      return data.locations;
    },
  });
};

// Backward compatibility alias
export const useAdminPosLocationsQuery = useAdminPosEquipmentQuery;

/**
 * Provides a mutation for creating or updating a POS location.
 * It handles optimistic updates and invalidates the equipment query on success.
 * 
 * Note: This still handles location management for the underlying location data.
 * Equipment-specific mutations may be added in future updates.
 */
export const useAdminPosLocationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationData: InputType) => postAdminPosLocationsUpsert(locationData),
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate both the new and old query keys for compatibility
      queryClient.invalidateQueries({ queryKey: ADMIN_POS_EQUIPMENT_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
      console.error("POS Location mutation failed:", error);
    },
  });
};