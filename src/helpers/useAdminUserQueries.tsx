import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsersList } from '../endpoints/admin/users-list_GET.schema';
import { postUpsertUser, type InputType as UpsertUserInput } from '../endpoints/admin/users/upsert_POST.schema';
import { getRolesList } from '../endpoints/admin/roles-list_GET.schema';

// Query key constants for cache management
export const ADMIN_USERS_LIST_QUERY_KEY = ['admin', 'users', 'list'] as const;
export const ADMIN_USER_DETAIL_QUERY_KEY = ['admin', 'users', 'detail'] as const;
export const ADMIN_ROLES_LIST_QUERY_KEY = ['admin', 'roles', 'list'] as const;

// Query hook for fetching users list with search/filter capabilities
export const useAdminUsersListQuery = (options?: {
  searchQuery?: string;
  roleFilter?: string;
  statusFilter?: 'active' | 'inactive';
}) => {
  return useQuery({
    queryKey: [...ADMIN_USERS_LIST_QUERY_KEY, options],
    queryFn: async () => {
      console.log('Fetching admin users list with options:', options);
      const result = await getAdminUsersList(options?.searchQuery);
      
      // Apply client-side filtering for role and status filters (search is now server-side)
      let filteredUsers = result.users;
      
      if (options?.roleFilter) {
        filteredUsers = filteredUsers.filter(user => 
          user.roleNames.includes(options.roleFilter!)
        );
      }
      
      if (options?.statusFilter) {
        const isActiveFilter = options.statusFilter === 'active';
        filteredUsers = filteredUsers.filter(user => user.isActive === isActiveFilter);
      }
      
      return { ...result, users: filteredUsers };
    },
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
};

// Mutation hook for creating and updating users
export const useAdminUserUpsertMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: UpsertUserInput) => {
      console.log('Upserting user:', userData.uuid ? 'Update' : 'Create', userData);
      return await postUpsertUser(userData);
    },
    onSuccess: (data, variables) => {
      console.log('User upsert successful:', data);
      
      // Invalidate and refetch users list to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ADMIN_USERS_LIST_QUERY_KEY 
      });
      
      // If we have a specific user detail query, invalidate that too
      if (variables.uuid) {
        queryClient.invalidateQueries({
          queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, variables.uuid]
        });
      }
    },
    onError: (error) => {
      console.error('User upsert failed:', error);
    },
  });
};

// Helper hook to get loading and error states for the users list
export const useAdminUsersListState = (options?: Parameters<typeof useAdminUsersListQuery>[0]) => {
  const query = useAdminUsersListQuery(options);
  
  return {
    users: query.data?.users || [],
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// Query hook for fetching roles list
export const useAdminRolesListQuery = () => {
  return useQuery({
    queryKey: ADMIN_ROLES_LIST_QUERY_KEY,
    queryFn: async () => {
      console.log('Fetching admin roles list');
      return await getRolesList();
    },
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
};

// Helper hook to get mutation states
export const useAdminUserUpsertState = () => {
  const mutation = useAdminUserUpsertMutation();
  
  return {
    upsertUser: mutation.mutate,
    upsertUserAsync: mutation.mutateAsync,
    isUpsertingUser: mutation.isPending,
    upsertError: mutation.error,
    isUpsertError: mutation.isError,
    isUpsertSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};