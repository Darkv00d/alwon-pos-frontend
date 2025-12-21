import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { DB } from "../../helpers/schema";
import { IdentificationType } from "../../helpers/User";

// Input schema for GET request with optional search parameter
export const schema = z.object({
  q: z.string().optional(),
});

// Define the user type for the frontend, including joined role names
export type UserWithRoles = Selectable<DB['users']> & {
  roleNames: string[];
  // Explicitly map snake_case fields from DB to camelCase for frontend consistency
  identificationType: string | null;
  identificationNumber: string | null;
  dateOfBirth: Date | null;
};

export type OutputType = {
  users: UserWithRoles[];
};

export const getAdminUsersList = async (searchQuery?: string, init?: RequestInit): Promise<OutputType> => {
  const url = new URL(`/_api/admin/users-list`, window.location.origin);
  if (searchQuery) {
    url.searchParams.set('q', searchQuery);
  }

  const result = await fetch(url.toString(), {
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