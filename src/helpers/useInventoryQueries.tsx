import { useQuery } from "@tanstack/react-query";
import { getLocations } from "../endpoints/locations_GET.schema";
import { getStockMovements, type InputType as StockMovementsInput } from "../endpoints/stock-movements_GET.schema";
import { getProductLots, type InputType as ProductLotsInput } from "../endpoints/product-lots_GET.schema";
import { getStockAvailable, type InputType as StockAvailableInput } from "../endpoints/inventory/stock-available_GET.schema";

export const useLocationsQuery = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => getLocations(),
    placeholderData: (previousData) => previousData,
  });
};

export const useStockMovementsQuery = (filters?: StockMovementsInput) => {
  return useQuery({
    // Include filters in the query key to ensure uniqueness
    queryKey: ["stockMovements", filters],
    queryFn: () => getStockMovements(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useProductLotsQuery = (filters?: ProductLotsInput, options?: { enabled?: boolean }) => {
  return useQuery({
    // Include filters in the query key
    queryKey: ["productLots", filters],
    queryFn: () => getProductLots(filters),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useStockAvailableQuery = (productUuid?: string, locationId?: number) => {
  return useQuery({
    // Include both parameters in the query key for unique cache
    queryKey: ["stockAvailable", { productUuid, locationId }],
    queryFn: () => getStockAvailable({ productUuid: productUuid!, locationId: locationId! }),
    placeholderData: (previousData) => previousData,
    // Only make the query if both parameters are available
    enabled: !!productUuid && !!locationId,
  });
};