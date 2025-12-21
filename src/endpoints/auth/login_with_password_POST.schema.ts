import { z } from "zod";
import { User, UserRole } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type OutputType = {
  user: User & { token?: string };
};

export const postLogin = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);

  // Get API URL from env.json
  const envResponse = await fetch('/env.json');
  const env = await envResponse.json();
  const API_URL = env.API_URL || 'http://localhost:8080/api';

  const result = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.error || errorData.message || "Login failed");
  }

  const loginResponse = await result.json();

  // Transform Java backend response to match frontend expected format
  return {
    user: {
      uuid: loginResponse.id?.toString() || "",
      email: loginResponse.email,
      displayName: loginResponse.name,
      role: (loginResponse.role?.toLowerCase() || "user") as UserRole,
      token: loginResponse.token
    }
  };
};
