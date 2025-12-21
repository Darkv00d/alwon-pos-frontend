import { z } from "zod";
import superjson from "superjson";

// No input schema is needed for this GET request.
export const schema = z.object({});

export type UserPermission = {
  code: string;
  name: string;
  canRead: boolean;
  canWrite: boolean;
};

export type OutputType = UserPermission[];

export const getUserPermissions = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/user-permissions`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(
      await result.text()
    );
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};