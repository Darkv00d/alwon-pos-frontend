import { z } from "zod";
import superjson from 'superjson';
import type { Selectable } from 'kysely';
import type { TimeClocks } from '../../../helpers/schema';

// The request is a GET request and filtering is done via headers, so no body schema is needed.
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type TimeClockPunch = Selectable<TimeClocks>;

export type OutputType = {
  ok: true;
  punches: TimeClockPunch[];
};

/**
 * Fetches today's time clock punches.
 * Filtering by location is handled by passing a comma-separated list of location IDs
 * in the 'x-location-ids' header within the `init` object.
 * e.g., `getTimeclockPunchesToday({}, { headers: { 'x-location-ids': '1,2,3' } })`
 */
export const getTimeclockPunchesToday = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/timeclock/punches/today`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{error: string;}>(await result.text());
    throw new Error(errorObject.error || "Failed to fetch today's punches");
  }

  return superjson.parse<OutputType>(await result.text());
};