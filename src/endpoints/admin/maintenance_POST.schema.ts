import { z } from "zod";
import superjson from 'superjson';

const MaintenanceOperationSchema = z.union([
  z.literal('seed'),
  z.literal('validate'),
  z.literal('performance'),
  z.literal('migrate'),
]);

export const schema = z.object({
  operation: MaintenanceOperationSchema,
  parameters: z.any().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  logs: string[];
  duration: number;
  details?: any;
};

export const postAdminMaintenance = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/maintenance`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  const responseText = await result.text();
  const json = superjson.parse<OutputType>(responseText);

  if (!result.ok) {
    // The error details are often in the 'details' or 'logs' field of our custom output type
    const errorMessage = json.logs?.join(' ') || 'An error occurred during maintenance operation.';
    throw new Error(errorMessage);
  }
  
  return json;
};