import { z } from "zod";
import superjson from 'superjson';
import { type LeaveRequestWithEmployee } from "./leave-requests_GET.schema";
import { LEAVE_REQUEST_TYPES, LEAVE_REQUEST_STATUSES } from "../helpers/leaveConstants";

const createOrUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  employeeUuid: z.string().uuid(),
  startsAt: z.date(),
  endsAt: z.date(),
  type: z.enum(LEAVE_REQUEST_TYPES),
  notes: z.string().optional(),
});

const approveOrRejectSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  approvedBy: z.string().uuid(),
});

export const schema = z.union([createOrUpdateSchema, approveOrRejectSchema]);

export type LeaveRequestPostInputType = z.infer<typeof schema>;
export type OutputType = LeaveRequestWithEmployee;

export const postLeaveRequest = async (body: LeaveRequestPostInputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/leave-requests`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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