import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postKioskPunch, type InputType, type OutputType } from '../endpoints/kiosk/punch_POST.schema';

export const useKioskPunchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: postKioskPunch,
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      // For now, we don't have specific queries to invalidate for time clock data
      console.log('Kiosk punch operation completed successfully');
    },
    onError: (error) => {
      console.error('Kiosk punch operation failed:', error);
    },
  });
};