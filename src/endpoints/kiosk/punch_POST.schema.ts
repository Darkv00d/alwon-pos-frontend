import { z } from "zod";
import superjson from "superjson";
import {
  schema as timeclockPunchSchema,
  type OutputType as TimeclockPunchOutputType,
} from "../timeclock/punch_POST.schema";

// Reuse the exact same schema from the timeclock endpoint to ensure consistency.
export const schema = timeclockPunchSchema;

// The input type is inferred from the reused schema.
export type InputType = z.infer<typeof schema>;

// The output type is the same as the timeclock endpoint's output.
export type OutputType = TimeclockPunchOutputType;

/**
 * Client-side fetcher to perform a kiosk punch-in/out operation.
 * @param body The request body, conforming to the InputType.
 * @param init Optional request initialization options.
 * @returns A promise that resolves with the punch operation result.
 * @throws An error if the request fails or returns a non-ok status.
 */
export const postKioskPunch = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/kiosk/punch`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse<{ error: string }>(text);
      throw new Error(errorObject.error || "An unknown error occurred");
    } catch (e) {
      // Fallback for non-JSON error responses
      throw new Error(text || "An unknown error occurred");
    }
  }

  return superjson.parse<OutputType>(text);
};