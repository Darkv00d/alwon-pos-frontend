import { useQuery } from "@tanstack/react-query";
import { getUserPermissions } from "../endpoints/auth/user-permissions_GET.schema";

export const USER_PERMISSIONS_QUERY_KEY = ["user", "permissions"];

/**
 * Fetches the module permissions for the currently authenticated user.
 * This hook is essential for client-side logic that needs to check
 * if a user has read or write access to a specific module, enabling
 * dynamic UI rendering (e.g., showing/hiding navigation links or buttons).
 *
 * The query is enabled only when the user is authenticated.
 */
export const useUserPermissionsQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: USER_PERMISSIONS_QUERY_KEY,
    queryFn: () => getUserPermissions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled,
  });
};