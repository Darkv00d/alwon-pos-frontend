import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  employeeUuids: z.array(z.string().uuid()).min(1, "At least one employee UUID is required."),
  periodStart: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  periodEnd: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
});

export type InputType = z.infer<typeof schema>;

export type SuccessOutputType = {
  ok: true;
  results: {
    employeeUuid: string;
    timesheetId: string;
    entryCount: number;
  }[];
  errors: {
    employeeUuid: string;
    error: string;
  }[];
};

export type ErrorOutputType = {
  ok: false;
  error: string;
};

export type OutputType = SuccessOutputType | ErrorOutputType;

export const postAdminWorkforceTimesheetsRun = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/workforce/timesheets_run`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  const parsed = superjson.parse<OutputType>(text);

  if (!result.ok) {
    const errorMessage = (parsed as ErrorOutputType).error || "An unknown error occurred during timesheet run.";
    throw new Error(errorMessage);
  }
  
  return parsed;
};