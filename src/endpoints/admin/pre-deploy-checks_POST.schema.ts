import { z } from "zod";
import superjson from "superjson";
import type { ValidationResult } from "../../helpers/deploymentAutomationModels";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// The output type matches the structure returned by the deployment check process
export type OutputType = {
  overallSuccess: boolean;
  message: string;
  checkResults: {
    checkName: string;
    success: boolean;
    message: string;
    details?: unknown[];
  }[];
};

/**
 * Client-side function to trigger the pre-deployment checks on the server.
 * This should only be called from administrative interfaces.
 * @param body An empty object, as no input is required.
 * @param init Optional request initialization options.
 * @returns A promise that resolves to the detailed results of the deployment checks.
 */
export const postAdminPreDeployChecks = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/pre-deploy-checks`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  const json = superjson.parse<OutputType | { error: string }>(responseText);

  if (!result.ok) {
    const errorMessage = (json as { error: string }).error || `HTTP error! status: ${result.status}`;
    throw new Error(errorMessage);
  }

  return json as OutputType;
};