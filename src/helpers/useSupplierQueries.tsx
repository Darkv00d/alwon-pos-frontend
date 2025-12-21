import { useQuery } from "@tanstack/react-query";
import { getSuppliers } from "../endpoints/suppliers_GET.schema";

export const SUPPLIERS_QUERY_KEY = "suppliers";

export const useSuppliersQuery = (
  query?: string,
  includeInactive?: boolean,
) => {
  const queryKey = [SUPPLIERS_QUERY_KEY, { query, includeInactive }];

  return useQuery({
    queryKey: queryKey,
    queryFn: () => getSuppliers({ q: query, includeInactive }),
    select: (data) => data.suppliers,
    placeholderData: (previousData) => previousData,
  });
};