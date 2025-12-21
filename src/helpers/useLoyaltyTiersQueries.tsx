import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomerTiers } from "../endpoints/customer-tiers_GET.schema";
import { 
  getLoyaltyCampaigns,
  type InputType as GetCampaignsInput
} from "../endpoints/loyalty-campaigns_GET.schema";
import { 
  postLoyaltyCampaigns,
  type InputType as CreateCampaignInput
} from "../endpoints/loyalty-campaigns_POST.schema";

export const CUSTOMER_TIERS_QUERY_KEY = "customerTiers";
export const LOYALTY_CAMPAIGNS_QUERY_KEY = "loyaltyCampaigns";

/**
 * Fetches all customer loyalty tiers.
 */
export const useCustomerTiersQuery = () => {
  return useQuery({
    queryKey: [CUSTOMER_TIERS_QUERY_KEY],
    queryFn: getCustomerTiers,
  });
};

/**
 * Fetches loyalty campaigns, with optional filtering.
 * @param params - Optional filters like isActive and includeProducts.
 */
export const useLoyaltyCampaignsQuery = (params?: GetCampaignsInput) => {
  return useQuery({
    queryKey: [LOYALTY_CAMPAIGNS_QUERY_KEY, params],
    queryFn: () => getLoyaltyCampaigns(params),
  });
};

/**
 * Mutation to create or update a loyalty campaign (UPSERT).
 * Invalidates the loyalty campaigns query on success to refetch the list.
 */
export const useCampaignMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaign: CreateCampaignInput) => postLoyaltyCampaigns(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_CAMPAIGNS_QUERY_KEY] });
    },
  });
};

/**
 * Alias for useCampaignMutation for backward compatibility.
 */
export const useCreateCampaignMutation = useCampaignMutation;

/**
 * Alias for useCampaignMutation for backward compatibility.
 */
export const useUpdateCampaignMutation = useCampaignMutation;