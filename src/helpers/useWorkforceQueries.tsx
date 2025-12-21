import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "./locationSelection";
import { getLeaveRequests, type OutputType as LeaveRequestsOutputType } from "../endpoints/leave-requests_GET.schema";
import { getEmployees, type OutputType as EmployeesOutputType } from "../endpoints/employees_GET.schema";
import { postLeaveRequest, type LeaveRequestPostInputType } from "../endpoints/leave-requests_POST.schema";
import { getHolidays, type OutputType as HolidaysOutputType } from "../endpoints/holidays_GET.schema";
import { getOvertimeRules, type OutputType as OvertimeRulesOutputType } from "../endpoints/overtime-rules_GET.schema";
import { postVehicles, type InputType as VehicleInputType } from "../endpoints/vehicles_POST.schema";
import { postPayrollTimesheet, type InputType as PayrollTimesheetInputType, type OutputType as PayrollTimesheetOutputType } from "../endpoints/payroll/timesheet_POST.schema";

// Vehicle and Route types (placeholder - these would come from actual schema files)
type Vehicle = {
  id: number;
  name: string | null;
  capacity: number | null;
};

type Route = {
  id: string;
  vehicleId: number | null;
  status: string | null;
  date: Date | null;
};

// Mock data for vehicles and routes (in a real app, these would come from API endpoints)
const mockVehicles: Vehicle[] = [];
const mockRoutes: Route[] = [];

export const useVehiclesQuery = () => {
  return useQuery<Vehicle[], Error>({
    queryKey: ["vehicles"],
    queryFn: async (): Promise<Vehicle[]> => {
      // This would normally fetch from an API endpoint
      return mockVehicles;
    },
  });
};

export const useRoutesQuery = () => {
  return useQuery<Route[], Error>({
    queryKey: ["routes"],
    queryFn: async (): Promise<Route[]> => {
      // This would normally fetch from an API endpoint  
      return mockRoutes;
    },
  });
};

export const useLeaveRequestsQuery = (params?: {
  employeeUuid?: string;
  status?: "pending" | "approved" | "rejected";
  type?: "vacation" | "sick" | "unpaid" | "other";
}) => {
  return useQuery<LeaveRequestsOutputType, Error>({
    queryKey: ["leaveRequests", params],
    queryFn: () => getLeaveRequests(params),
  });
};

export const useEmployeesQuery = (params?: {
  search?: string;
  status?: "active" | "inactive";
}) => {
  return useQuery<EmployeesOutputType, Error>({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
  });
};

export const useLeaveRequestMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LeaveRequestPostInputType) => {
      return postLeaveRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
    },
  });
};

// Location-aware overtime rules query using useApiQuery
export const useOvertimeRulesQueryWithLocation = () => {
  return useApiQuery<OvertimeRulesOutputType, Error>(
    ["overtimeRules"],
    async (init) => {
      // The search string from date range and location headers are automatically added
      const searchString = (init as any).searchString || '';
      const url = `/_api/overtime-rules${searchString ? `?${searchString}` : ''}`;
      
      const result = await fetch(url, init);
      if (!result.ok) {
        throw new Error(`Failed to fetch overtime rules: ${result.statusText}`);
      }
      return result.json();
    }
  );
};

// Backward compatible version without location awareness
export const useOvertimeRulesQuery = () => {
  return useQuery<OvertimeRulesOutputType, Error>({
    queryKey: ["overtimeRules"],
    queryFn: () => getOvertimeRules(),
  });
};

export const useOvertimeRuleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      // This would call an actual API endpoint
      throw new Error("Overtime rule mutation not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtimeRules"] });
    },
  });
};

// Location-aware holidays query using useApiQuery
// This automatically includes location filtering via X-Location-Ids header
// and date range filtering via URL parameters
export const useHolidaysQueryWithLocation = () => {
  return useApiQuery<HolidaysOutputType, Error>(
    ["holidays"],
    async (init) => {
      // The locationSelection helper automatically adds:
      // - X-Location-Ids header based on selected locations
      // - from/to URL parameters based on selected date range
      const searchString = (init as any).searchString || '';
      const url = `/_api/holidays${searchString ? `?${searchString}` : ''}`;
      
      const result = await fetch(url, init);
      if (!result.ok) {
        throw new Error(`Failed to fetch holidays: ${result.statusText}`);
      }
      return result.json();
    }
  );
};

// Backward compatible version without location awareness
export const useHolidaysQuery = () => {
  return useQuery<HolidaysOutputType, Error>({
    queryKey: ["holidays"],
    queryFn: () => getHolidays(),
  });
};

// Example of direct function usage with location context
export const fetchHolidaysWithLocation = async (locationIds: number[], dateRange?: { from: string; to: string }) => {
  const headers = new Headers();
  if (locationIds.length > 0) {
    headers.append("X-Location-Ids", locationIds.join(","));
  }

  let url = "/_api/holidays";
  if (dateRange) {
    const searchParams = new URLSearchParams();
    searchParams.set("from", dateRange.from);
    searchParams.set("to", dateRange.to);
    url += `?${searchParams.toString()}`;
  }

  const result = await fetch(url, { headers });
  if (!result.ok) {
    throw new Error(`Failed to fetch holidays: ${result.statusText}`);
  }
  return result.json() as Promise<HolidaysOutputType>;
};

// Example of direct function usage with overtime rules
export const fetchOvertimeRulesWithLocation = async (locationIds: number[]) => {
  const headers = new Headers();
  if (locationIds.length > 0) {
    headers.append("X-Location-Ids", locationIds.join(","));
  }

  const result = await fetch("/_api/overtime-rules", { headers });
  if (!result.ok) {
    throw new Error(`Failed to fetch overtime rules: ${result.statusText}`);
  }
  return result.json() as Promise<OvertimeRulesOutputType>;
};

export const useVehicleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: VehicleInputType) => {
      return postVehicles(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
};

export const useHolidaysMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ action, payload }: { action: "add" | "delete"; payload: any }) => {
      // This would call an actual API endpoint
      throw new Error("Holiday mutation not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
};

export const usePayrollTimesheetMutation = () => {
  return useMutation<PayrollTimesheetOutputType, Error, PayrollTimesheetInputType>({
    mutationFn: (data) => postPayrollTimesheet(data),
  });
};