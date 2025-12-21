import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { getAdminReorderSuggestions } from "../endpoints/admin/reorder/suggestions_GET.schema";
import { postAdminReorderRecompute } from "../endpoints/admin/reorder/recompute_POST.schema";
import { postAdminReorderApply } from "../endpoints/admin/reorder/apply_POST.schema";

const REORDER_SUGGESTIONS_QUERY_KEY = "reorderSuggestions";

/**
 * Query to fetch reorder suggestions.
 * @param params - Object containing status and locationIds filters.
 * @param params.status - Filter suggestions by status (e.g., 'open').
 * @param params.locationIds - Filter suggestions for specific locations.
 * @returns A React Query object for the suggestions query.
 */
export const useReorderSuggestionsQuery = (params: {
  status?: string;
  locationIds: number[];
}) => {
  const { status, locationIds } = params;
  const { authState } = useAuth();

  const isAuthenticatedAdmin =
    authState.type === "authenticated" && authState.user.role === "admin";

  return useQuery({
    queryKey: [REORDER_SUGGESTIONS_QUERY_KEY, { status, locationIds }],
    queryFn: async () => {
      return getAdminReorderSuggestions(locationIds, { status });
    },
    enabled: isAuthenticatedAdmin,
    refetchInterval: status === "open" ? 30 * 1000 : false, // Refetch every 30 seconds if status is 'open'
  });
};

/**
 * Mutation to trigger a recalculation of reorder suggestions.
 * Invalidates the suggestions query on success.
 * @returns A React Query mutation object for recomputing suggestions.
 */
export const useRecomputeReorderMutation = () => {
  const queryClient = useQueryClient();
  const { authState } = useAuth();

  return useMutation({
    mutationFn: async (variables: {
      daysWindow?: number;
      locationIds: number[];
    }) => {
      if (authState.type !== "authenticated") {
        throw new Error("User is not authenticated.");
      }
      const { locationIds, ...body } = variables;
      return postAdminReorderRecompute(locationIds, body);
    },
    onSuccess: (data) => {
      toast.success(
        `Recomputation complete. ${data.created} new suggestions created, ${data.dismissed} dismissed.`
      );
      queryClient.invalidateQueries({
        queryKey: [REORDER_SUGGESTIONS_QUERY_KEY],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during recomputation.";
      toast.error(errorMessage);
      console.error("Recompute mutation failed:", error);
    },
  });
};

/**
 * Mutation to apply reorder suggestions, creating purchase orders.
 * Invalidates suggestions and purchase order queries on success.
 * @returns A React Query mutation object for applying suggestions.
 */
export const useApplyReorderMutation = () => {
  const queryClient = useQueryClient();
  const { authState } = useAuth();

  return useMutation({
    mutationFn: async (variables: { suggestionIds: number[] }) => {
      if (authState.type !== "authenticated") {
        throw new Error("User is not authenticated.");
      }
      return postAdminReorderApply(variables);
    },
    onSuccess: (data) => {
      const poCount = data.createdPOs.length;
      toast.success(
        `${poCount} Purchase Order${
          poCount > 1 ? "s" : ""
        } created successfully.`
      );
      queryClient.invalidateQueries({
        queryKey: [REORDER_SUGGESTIONS_QUERY_KEY],
      });
      // Assuming a query key for purchase orders exists, as requested.
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while applying suggestions.";
      toast.error(errorMessage);
      console.error("Apply suggestions mutation failed:", error);
    },
  });
};