import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLoyaltySettings,
} from "../endpoints/loyalty-settings_GET.schema";
import {
  postLoyaltySettingsUpdate,
  type InputType as UpdateLoyaltySettingsInput,
} from "../endpoints/loyalty-settings/update_POST.schema";

export const LOYALTY_SETTINGS_QUERY_KEY = "loyaltySettings";

/**
 * Fetches the current loyalty program settings.
 */
export const useLoyaltySettingsQuery = () => {
  return useQuery({
    queryKey: [LOYALTY_SETTINGS_QUERY_KEY],
    queryFn: () => getLoyaltySettings(),
  });
};

/**
 * Mutation to update loyalty program settings.
 * Invalidates the loyalty settings query on success to refetch the configuration.
 */
export const useUpdateLoyaltySettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: UpdateLoyaltySettingsInput) =>
      postLoyaltySettingsUpdate(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_SETTINGS_QUERY_KEY] });
    },
  });
};