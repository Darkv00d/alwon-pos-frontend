import { z } from "zod";
import superjson from 'superjson';
import { type EmployeeWithRelations } from "./employees_GET.schema";

export const schema = z.object({
  uuid: z.string().uuid().optional(),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  code: z.string().min(1, "Employee code is required."),
  pin: z.string().min(4, "PIN must be at least 4 digits.").max(6, "PIN cannot be more than 6 digits.").optional(),
  status: z.enum(["active", "inactive"]),
  defaultLocationId: z.number().nullable().optional(),
  departmentId: z.number().optional(),
  positionId: z.number().optional(),
});

export type EmployeePostInputType = z.infer<typeof schema>;
export type OutputType = EmployeeWithRelations;

export const postEmployees = async (body: EmployeePostInputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/employees`, {
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