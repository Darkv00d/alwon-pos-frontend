import { z } from "zod";
import superjson from 'superjson';
import { type ComputedTimesheetEntry } from "../../helpers/payrollTypes";

export const schema = z.object({
  employeeUuid: z.string().uuid(),
  periodStart: z.string(), // ISO date
  periodEnd: z.string(),   // ISO date
  createTimesheet: z.boolean().optional().default(true)
});

export type InputType = z.infer<typeof schema>;

// The output type includes both success and error cases
export type OutputType = {
  ok: true;
  timesheetId: string | null;
  entries: ComputedTimesheetEntry[];
} | {
  ok: false;
  error: string;
};

export const postPayrollTimesheet = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/payroll/timesheet`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ ok: false; error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};