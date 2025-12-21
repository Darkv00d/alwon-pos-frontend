import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEmployees,
  type EmployeesGetInputType,
  type EmployeeWithRelations,
} from "../endpoints/employees_GET.schema";
import {
  postUpsertEmployee,
  type InputType,
} from "../endpoints/employees/upsert_POST.schema";
import { getDepartments } from "../endpoints/departments_GET.schema";
import { getPositions } from "../endpoints/positions_GET.schema";
import { getLocations } from "../endpoints/locations_GET.schema";

// --- Query Keys ---
export const EMPLOYEES_QUERY_KEY = "employees";
export const DEPARTMENTS_QUERY_KEY = "departments";
export const POSITIONS_QUERY_KEY = "positions";
export const LOCATIONS_QUERY_KEY = "locations";

// --- Employee Management ---

/**
 * Hook to fetch employees with optional filters.
 * @param filters - Optional filters for search and status.
 * @returns A query object with employees data, loading state, and error information.
 */
export const useEmployeesQuery = (filters: EmployeesGetInputType = {}) => {
  const queryKey: QueryKey = [EMPLOYEES_QUERY_KEY, filters];
  return useQuery({
    queryKey,
    queryFn: () => getEmployees(filters),
  });
};

/**
 * Hook for creating and updating employees.
 * Provides optimistic updates and invalidates employee queries on success.
 */
export const useEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeData: InputType) =>
      postUpsertEmployee(employeeData),
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
      // Invalidation on settle is simpler and more robust for a complex object like employee
      console.log("Attempting to save employee:", newEmployee);
      return { newEmployee };
    },
    onError: (err, newEmployee) => {
      const action = newEmployee.uuid ? "update" : "create";
      toast.error(`Failed to ${action} employee: ${err.message}`);
      console.error(`Error ${action}ing employee:`, err);
    },
    onSuccess: (data, variables) => {
      const action = variables.uuid ? "updated" : "created";
      toast.success(`Employee successfully ${action}.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
    },
  });
};

// --- Related Data Fetching ---

/**
 * Hook to fetch all departments.
 */
export const useDepartmentsQuery = () => {
  return useQuery({
    queryKey: [DEPARTMENTS_QUERY_KEY],
    queryFn: getDepartments,
  });
};

/**
 * Hook to fetch all positions.
 */
export const usePositionsQuery = () => {
  return useQuery({
    queryKey: [POSITIONS_QUERY_KEY],
    queryFn: getPositions,
  });
};

/**
 * Hook to fetch all locations.
 */
export const useLocationsQuery = () => {
  return useQuery({
    queryKey: [LOCATIONS_QUERY_KEY],
    queryFn: getLocations,
  });
};