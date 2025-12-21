import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminModulesList } from "../endpoints/admin/modules-list_GET.schema";
import { postAdminRoleDelete } from "../endpoints/admin/role/delete_POST.schema";

export const ADMIN_MODULES_LIST_QUERY_KEY = ["admin", "modules-list"];

/**
 * Fetches the complete list of modules and roles with their permissions.
 * This hook is intended for use in the admin section to power the role
 * management interface.
 */
export const useAdminModulesListQuery = () => {
  return useQuery({
    queryKey: ADMIN_MODULES_LIST_QUERY_KEY,
    queryFn: getAdminModulesList,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Mutation hook for deleting a role.
 * Automatically invalidates the modules list query after successful deletion.
 */
export const useAdminRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postAdminRoleDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_LIST_QUERY_KEY });
    },
  });
};