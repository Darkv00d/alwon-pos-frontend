import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Employees } from "../helpers/schema";

export const schema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type EmployeesGetInputType = z.infer<typeof schema>;

export type EmployeeWithRelations = Selectable<Employees> & {
  departmentId: number | null;
  positionId: number | null;
};

export type OutputType = EmployeeWithRelations[];

export const getEmployees = async (params?: EmployeesGetInputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.set('search', params.search);
  }
  if (params?.status) {
    queryParams.set('status', params.status);
  }
  
  const queryString = queryParams.toString();
  const url = `/_api/employees${queryString ? `?${queryString}` : ''}`;

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