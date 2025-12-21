import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminPosLocations } from "../endpoints/admin/pos-locations/list_GET.schema";
import {
  postAdminPosLocationsUpsert,
  type InputType,
} from "../endpoints/admin/pos-locations/upsert_POST.schema";
import { toast } from "sonner";

export const ADMIN_POS_EQUIPMENT_QUERY_KEY = ["admin", "pos-equipment"];

/**
 * Fetches the list of all POS equipment (active and inactive) for admin purposes.
 */
export const useAdminPosEquipmentQuery = () => {
  return useQuery({
    queryKey: ADMIN_POS_EQUIPMENT_QUERY_KEY,
    queryFn: async () => {
      const data = await getAdminPosLocations();
      return data.posLocations;
    },
  });
};

/**
 * Provides a mutation for creating or updating a POS equipment record.
 * It handles optimistic updates and invalidates the equipment query on success.
 */
export const useAdminPosEquipmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentData: InputType) =>
      postAdminPosLocationsUpsert(equipmentData),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ADMIN_POS_EQUIPMENT_QUERY_KEY });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(errorMessage);
      console.error("POS Equipment mutation failed:", error);
    },
  });
};