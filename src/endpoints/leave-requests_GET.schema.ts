import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type LeaveRequests } from "../helpers/schema";
import { LEAVE_REQUEST_STATUSES, LEAVE_REQUEST_TYPES } from "../helpers/leaveConstants";

export const schema = z.object({
  employeeUuid: z.string().uuid().optional(),
  status: z.enum(LEAVE_REQUEST_STATUSES).optional(),
  type: z.enum(LEAVE_REQUEST_TYPES).optional(),
});

export type LeaveRequestsGetInputType = z.infer<typeof schema>;

export type LeaveRequestWithEmployee = Selectable<LeaveRequests> & {
  employeeFullName: string | null;
};

export type OutputType = LeaveRequestWithEmployee[];

export const getLeaveRequests = async (params?: LeaveRequestsGetInputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.employeeUuid) {
    queryParams.set('employeeUuid', params.employeeUuid);
  }
  if (params?.status) {
    queryParams.set('status', params.status);
  }
  if (params?.type) {
    queryParams.set('type', params.type);
  }
  
  const queryString = queryParams.toString();
  const url = `/_api/leave-requests${queryString ? `?${queryString}` : ''}`;

  const result = await fetch(url, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};