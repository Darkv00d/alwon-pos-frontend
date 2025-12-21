import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { TimeClocks, Employees, Positions, Departments } from "../../../helpers/schema";

// No input schema needed for this GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type AdminPunch = Selectable<TimeClocks> & {
  fullName: string | null;
  employeeCode: string | null;
  positionName: string | null;
  departmentName: string | null;
};

export type PunchesSummary = {
  totalEmployeesClockedIn: number;
  employeesCurrentlyClockedIn: number;
  totalHoursWorked: number;
};

export type OutputType = {
  punches: AdminPunch[];
  summary: PunchesSummary;
};

export const getAdminWorkforcePunchesToday = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/workforce/punches_today`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(text);
    throw new Error(errorObject.error || "An unknown error occurred");
  }

  return superjson.parse<OutputType>(text);
};