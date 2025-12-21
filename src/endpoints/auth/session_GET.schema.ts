import { z } from "zod";
import { User, UserRole } from "../../helpers/User";

// no schema, just a simple GET request
export const schema = z.object({});

export type OutputType =
  | {
    user: User;
  }
  | {
    error: string;
  };

export const getSession = async (
  body: z.infer<typeof schema> = {},
  init?: RequestInit
): Promise<OutputType> => {
  try {
    // Get API URL from env.json
    const envResponse = await fetch('/env.json');
    const env = await envResponse.json();
    const API_URL = env.API_URL || 'http://localhost:8080/api';

    // Get token from localStorage
    const token = localStorage.getItem('alwon_auth_token');

    if (!token) {
      return { error: "No authentication token found" };
    }

    // Add timeout to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const result = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        ...init,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!result.ok) {
        // If 401/403, return specific error
        if (result.status === 401 || result.status === 403) {
          return { error: "Session expired or invalid" };
        }
        return { error: `Server returned ${result.status}` };
      }

      const userData = await result.json();

      // Transform Java backend response to frontend User format
      return {
        user: {
          uuid: userData.id?.toString() || "",
          email: userData.email,
          displayName: userData.name,
          role: (userData.role?.toLowerCase() || "user") as UserRole,
        }
      };
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        console.error("Session check timed out");
        return { error: "Session check timed out" };
      }
      throw e;
    }
  } catch (error) {
    console.error("Session check failed:", error);
    return { error: "Failed to check session" };
  }
};
