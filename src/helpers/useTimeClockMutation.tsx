import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postTimeclockPunch,
  InputType,
  OutputType,
} from "../endpoints/timeclock/punch_POST.schema";

export const useTimeClockMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: postTimeclockPunch,
    onSuccess: () => {
      // Invalidate any queries that might depend on time clock data,
      // such as a query for today's punches or payroll data.
      // For now, we don't have a specific query to invalidate, but this is where it would go.
      // e.g., queryClient.invalidateQueries({ queryKey: ['timeclock', 'today'] });
    },
    onError: (error) => {
      console.error("Time clock punch failed:", error);
      // Error handling can be done in the component using the `error` object from the mutation.
    },
  });
};