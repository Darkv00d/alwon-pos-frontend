import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postUpsertShift,
  type InputType,
} from "../endpoints/shifts/upsert_POST.schema";

// --- Query Keys ---
export const SHIFTS_QUERY_KEY = "shifts";

/**
 * Hook for creating and updating shifts.
 * Invalidates shift queries on success to refetch the latest data.
 */
export const useShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shiftData: InputType) => postUpsertShift(shiftData),
    onMutate: async (newShift) => {
      console.log("Attempting to save shift:", newShift);
      // Invalidation on settle is simpler and more robust
      await queryClient.cancelQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
    onError: (err, newShift) => {
      const action = newShift.id ? "update" : "create";
      toast.error(`Failed to ${action} shift: ${err.message}`);
      console.error(`Error ${action}ing shift:`, err);
    },
    onSuccess: (data, variables) => {
      const action = variables.id ? "updated" : "created";
      toast.success(`Shift successfully ${action}.`);
    },
    onSettled: () => {
      // Invalidate any queries related to shifts to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });
};