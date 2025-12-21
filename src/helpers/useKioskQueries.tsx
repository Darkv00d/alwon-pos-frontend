import { useQuery } from '@tanstack/react-query';
import { getAdminKiosks } from '../endpoints/admin/kiosks_GET.schema';

export const ADMIN_KIOSKS_QUERY_KEY = ['admin', 'kiosks'] as const;

/**
 * A React Query hook to fetch the list of all kiosks.
 * This is intended for use in admin-facing interfaces.
 */
export function useKiosksQuery() {
  return useQuery({
    queryKey: ADMIN_KIOSKS_QUERY_KEY,
    queryFn: () => getAdminKiosks(),
  });
}