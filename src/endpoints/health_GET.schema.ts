import { z } from "zod";
import superjson from 'superjson';

// No input schema is needed for a simple GET health check.
// The 'deep' parameter is handled in the endpoint logic.
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

type CheckStatus = 'ok' | 'error';

interface CheckResult {
  status: CheckStatus;
  message: string;
  durationMs?: number;
}

interface DataValidationResult {
  checkName: string;
  success: boolean;
  message: string;
  details?: unknown[];
}

export type OutputType = {
  status: CheckStatus;
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    configuration: CheckResult;
    dataValidation?: DataValidationResult[] | null;
  };
  metrics: {
    totalDurationMs: number;
  };
  error?: string;
};

export const getHealth = async (
  // Optional 'deep' parameter for more thorough checks
  params?: { deep?: boolean },
  init?: RequestInit
): Promise<OutputType> => {
  const url = new URL(`/_api/health`, window.location.origin);
  if (params?.deep) {
    url.searchParams.append('deep', 'true');
  }

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  // The response might not be ok but still contain a valid health check body
  const text = await result.text();
  try {
    return superjson.parse<OutputType>(text);
  } catch (e) {
    console.error("Failed to parse health check response:", text);
    throw new Error("Received an invalid response from the health check endpoint.");
  }
};