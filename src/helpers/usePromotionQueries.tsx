import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPromotions,
  type InputType as GetPromotionsInput,
  type OutputType as GetPromotionsOutput,
} from "../endpoints/promotions_GET.schema";
import {
  postPromotions,
  type InputType as UpsertPromotionInput,
} from "../endpoints/promotions_POST.schema";
import {
  postPromotionsApply,
  type InputType as ApplyPromotionInput,
} from "../endpoints/promotions/apply_POST.schema";
import type { CartTotal } from "./pricingTypes";
import {
  postCouponsValidate,
  type InputType as ValidateCouponInput,
  type OutputType as ValidateCouponOutput,
} from "../endpoints/coupons/validate_POST.schema";

export const PROMOTIONS_QUERY_KEY = "promotions";

/**
 * React Query hook to fetch a list of promotions.
 * @param filters Optional filters for active status, promotion type, and search term.
 */
export const usePromotionsQuery = (filters?: GetPromotionsInput) => {
  return useQuery<GetPromotionsOutput, Error>({
    queryKey: [PROMOTIONS_QUERY_KEY, filters],
    queryFn: () => getPromotions(filters),
  });
};

/**
 * React Query mutation hook to create or update a promotion.
 * Invalidates the promotions query on success.
 */
export const usePromotionUpsertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionData: UpsertPromotionInput) =>
      postPromotions(promotionData),
    onSuccess: (data, variables) => {
      toast.success(
        variables.id
          ? "Promotion updated successfully!"
          : "Promotion created successfully!"
      );
      queryClient.invalidateQueries({ queryKey: [PROMOTIONS_QUERY_KEY] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while saving the promotion.";
      toast.error(errorMessage);
      console.error("Error upserting promotion:", error);
    },
  });
};

/**
 * React Query mutation hook to apply promotions to a shopping cart.
 * This is a calculation and does not invalidate any queries.
 */
export const usePromotionApplyMutation = () => {
  return useMutation<CartTotal, Error, ApplyPromotionInput>({
    mutationFn: (cartData: ApplyPromotionInput) => postPromotionsApply(cartData),
    onError: (error: unknown) => {
      // The component calling this mutation is responsible for user-facing errors.
      // We just log it here for debugging.
      console.error("Error applying promotions:", error);
    },
  });
};

/**
 * React Query mutation hook to validate a coupon code.
 * This is a validation check and does not invalidate any queries.
 */
export const useCouponValidationMutation = () => {
  return useMutation<ValidateCouponOutput, Error, ValidateCouponInput>({
    mutationFn: (validationData: ValidateCouponInput) =>
      postCouponsValidate(validationData),
    onError: (error: unknown) => {
      // The component calling this mutation is responsible for user-facing errors.
      // We just log it here for debugging.
      console.error("Error validating coupon:", error);
    },
  });
};