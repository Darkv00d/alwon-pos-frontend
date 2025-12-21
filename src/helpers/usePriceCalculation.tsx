import { useMutation, useQuery } from "@tanstack/react-query";
import {
  postProductsCalculatePrice,
  type InputType as PriceCalculationInput,
  type OutputType as PriceCalculationOutput,
} from "../endpoints/products/calculate-price_POST.schema";

/**
 * A mutation hook for calculating product prices on demand.
 * Useful for one-time calculations, e.g., when a user clicks a button to check a price.
 *
 * @returns A mutation object from React Query, including `mutate`, `mutateAsync`, `data`, `isPending`, and `error`.
 *
 * @example
 * const { mutateAsync, isPending } = usePriceCalculationMutation();
 * const handleCalculate = async () => {
 *   try {
 *     const result = await mutateAsync({ productId: 1, quantity: 2 });
 *     if (result.success && result.data) {
 *       console.log('Final Price:', result.data.finalPrice);
 *     } else {
 *       console.error(result.error);
 *     }
 *   } catch (error) {
 *     console.error('Calculation failed:', error);
 *   }
 * };
 */
export const usePriceCalculationMutation = () => {
  return useMutation<
    PriceCalculationOutput,
    Error,
    PriceCalculationInput
  >({
    mutationFn: async (variables: PriceCalculationInput) => {
      const result = await postProductsCalculatePrice(variables);
      if (!result.success) {
        // Throw an error to be caught by onError or the try-catch block
        throw new Error(result.error ?? "Price calculation failed");
      }
      return result;
    },
    onError: (error) => {
      console.error("Error in usePriceCalculationMutation:", error.message);
    },
  });
};

type UseProductPriceQueryProps = PriceCalculationInput;

/**
 * A query hook for fetching and displaying product prices in real-time.
 * The query automatically runs when its parameters (productId, quantity, etc.) change.
 * It is disabled if `productId` is not provided or `quantity` is not a positive number.
 *
 * @param {UseProductPriceQueryProps} params - The parameters for the price calculation.
 * @returns A query object from React Query, including `data`, `isLoading`, `error`, and `refetch`.
 *
 * @example
 * const { data, isLoading, error } = useProductPriceQuery({
 *   productId: 123,
 *   quantity: 2,
 *   locationId: 1,
 *   channel: 'pos'
 * });
 *
 * if (isLoading) return <p>Loading price...</p>;
 * if (error) return <p>Error: {error.message}</p>;
 * if (data?.success && data.data) {
 *   return <p>Price: {data.data.finalPrice}</p>;
 * }
 */
export const useProductPriceQuery = (params: UseProductPriceQueryProps) => {
  const { productId, quantity } = params;

  return useQuery<PriceCalculationOutput, Error>({
    queryKey: [
      "productPrice", 
      productId, 
      quantity, 
      params.locationId ?? 0, 
      params.channel ?? "", 
      params.customerId ?? 0, 
      params.couponCode ?? ""
    ],
    queryFn: async () => {
      const result = await postProductsCalculatePrice(params);
      // React Query's queryFn should throw on error for the `error` state to be populated.
      if (!result.success) {
        throw new Error(result.error ?? "Failed to fetch product price");
      }
      return result;
    },
    // Enable the query only when we have a valid product and quantity to check.
    enabled: !!productId && typeof quantity === 'number' && quantity > 0 && params.locationId !== undefined,
    // Prices are relatively stable, so we can cache them for a longer period.
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
  });
};