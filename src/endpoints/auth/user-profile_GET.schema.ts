import { z } from "zod";
import superjson from "superjson";

// No input schema is needed for this GET request.
export const schema = z.object({});

export type UserProfile = {
  ok: true;
  user: {
    uuid: string;
    email: string;
    displayName: string;
  };
  roles: string[];
  modules: Array<{
    code: string;
    name: string;
    canRead: boolean;
    canWrite: boolean;
  }>;
  grants: string[];
};

export type UserProfileError = {
  ok: false;
  error: string;
};

export type OutputType = UserProfile | UserProfileError;

export const getUserProfile = async (
  init?: RequestInit
): Promise<UserProfile> => {
  const result = await fetch(`/_api/auth/user-profile`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseJson = superjson.parse<OutputType>(await result.text());

  if (!result.ok || !responseJson.ok) {
    const errorMsg = !responseJson.ok
      ? responseJson.error
      : "Failed to fetch user profile";
    throw new Error(errorMsg);
  }

  return responseJson;
};