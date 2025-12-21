export const LEAVE_REQUEST_TYPES = ["vacation", "sick", "unpaid", "other"] as const;
export const LEAVE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type LeaveRequestType = typeof LEAVE_REQUEST_TYPES[number];
export type LeaveRequestStatus = typeof LEAVE_REQUEST_STATUSES[number];