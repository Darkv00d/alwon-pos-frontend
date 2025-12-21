import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPosEquipment, InputType as GetInputType } from "../endpoints/pos-equipment_GET.schema";
import { postPosEquipment, InputType as PostInputType } from "../endpoints/pos-equipment_POST.schema";

/**
 * Query key for POS equipment data.
 */
export const POS_EQUIPMENT_QUERY_KEY = ["pos-equipment"];

type UsePosEquipmentQueryFilters = GetInputType & {
  locationIds?: number[];
};

/**
 * A hook to fetch POS equipment with optional filtering.
 * @param filters - Optional filters for the query.
 * @param filters.locationId - Filter by a single location ID.
 * @param filters.isActive - Filter by active status.
 * @param filters.locationIds - Filter by a list of location IDs.
 */
export const usePosEquipmentQuery = (filters: UsePosEquipmentQueryFilters = {}) => {
  const { locationIds, ...apiFilters } = filters;

  return useQuery({
    queryKey: [...POS_EQUIPMENT_QUERY_KEY, filters],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (locationIds && locationIds.length > 0) {
        headers['X-Location-Ids'] = locationIds.join(',');
      }

      const data = await getPosEquipment(apiFilters, { headers });
      return data.equipment;
    },
  });
};

/**
 * A hook for creating new POS equipment.
 * Invalidates the POS equipment query on success.
 */
export const useCreatePosEquipmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newEquipment: PostInputType) => postPosEquipment(newEquipment),
    onSuccess: (data) => {
      toast.success(`Equipment "${data.equipment.name}" created successfully.`);
      queryClient.invalidateQueries({ queryKey: POS_EQUIPMENT_QUERY_KEY });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create equipment: ${errorMessage}`);
      console.error("Create POS Equipment mutation failed:", error);
    },
  });
};

/**
 * A placeholder hook for updating POS equipment.
 * This should be implemented once the corresponding PUT/PATCH endpoint is available.
 */
export const useUpdatePosEquipmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: async (updatedEquipment: UpdateInputType) => {
    //   // Replace with the actual API call when available
    //   console.log("Updating equipment:", updatedEquipment);
    //   // return await patchPosEquipment(updatedEquipment);
    //   return Promise.resolve();
    // },
    mutationFn: async (_updatedEquipment: { id: number } & Partial<PostInputType>) => {
      // This is a placeholder. The endpoint does not exist yet.
      toast.error("Update functionality is not yet implemented.");
      throw new Error("Update endpoint for POS equipment is not available.");
    },
    onSuccess: () => {
      toast.success("Equipment updated successfully.");
      queryClient.invalidateQueries({ queryKey: POS_EQUIPMENT_QUERY_KEY });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("not available")) {
        // Don't show an error toast for the placeholder functionality
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update equipment: ${errorMessage}`);
      console.error("Update POS Equipment mutation failed:", error);
    },
  });
};