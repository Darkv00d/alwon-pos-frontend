import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Roles } from "../../helpers/schema";

// No input schema needed for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// The output type is an array of roles, derived from the database schema
// to ensure a single source of truth.
export type OutputType = {
  roles: Selectable<Roles>[];
};

/**
 * Fetches the list of all available roles.
 * Requires 'read' permission for the 'USER_MANAGEMENT' module.
 * @param init Optional request init options.
 * @returns A promise that resolves to the list of roles.
 */
export const getRolesList = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/roles-list`, {
    method: "GET",
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
      throw new Error(errorObject.error);
    } catch (e) {
      // Fallback if parsing fails
      throw new Error(`Failed to fetch roles: ${result.statusText}`);
    }
  }

  return superjson.parse<OutputType>(text);
};