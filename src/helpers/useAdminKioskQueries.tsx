import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminKiosks } from '../endpoints/admin/kiosks_GET.schema';
import { postAdminKiosksUpdate, InputType as UpdateKioskInput } from '../endpoints/admin/kiosks/update_POST.schema';
import { toast } from 'sonner';

export const KIOSKS_QUERY_KEY = ['admin', 'kiosks'];

/**
 * Fetches a list of all kiosks with their associated location names.
 */
export function useKiosksList() {
  return useQuery({
    queryKey: KIOSKS_QUERY_KEY,
    queryFn: () => getAdminKiosks(),
    placeholderData: [],
  });
}

/**
 * Provides a mutation for updating a kiosk's details.
 * Invalidates the kiosk list query on success.
 * Shows toast notifications for success and error states.
 */
export function useUpdateKiosk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kioskData: UpdateKioskInput) => postAdminKiosksUpdate(kioskData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Kiosk "${result.kiosk.name}" updated successfully.`);
        queryClient.invalidateQueries({ queryKey: KIOSKS_QUERY_KEY });
      } else {
        toast.error(`Failed to update kiosk: ${result.error}`);
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to update kiosk: ${errorMessage}`);
      console.error("Error updating kiosk:", error);
    },
  });
}