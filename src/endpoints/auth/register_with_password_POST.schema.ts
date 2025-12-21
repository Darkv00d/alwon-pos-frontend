import { z } from "zod";
import { User, UserRole } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required").optional(),
});

export type OutputType = {
  user: User & { token?: string };
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);

  // Get API URL from env.json
  const envResponse = await fetch('/env.json');
  const env = await envResponse.json();
  const API_URL = env.API_URL || 'http://localhost:8080/api';

  // Transform to Java backend format
  const registerData = {
    email: validatedInput.email,
    password: validatedInput.password,
    name: validatedInput.displayName || validatedInput.email.split('@')[0],
    role: "USER" // Default role
  };

  const result = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify(registerData),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.error || errorData.message || "Registration failed");
  }

  const registerResponse = await result.json();

  // After registration, automatically login to get the token
  const loginResult = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: validatedInput.email,
      password: validatedInput.password
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (loginResult.ok) {
    const loginData = await loginResult.json();
    return {
      user: {
        uuid: loginData.id?.toString() || "",
        email: loginData.email,
        displayName: loginData.name,
        role: (loginData.role?.toLowerCase() || "user") as UserRole,
        token: loginData.token
      }
    };
  }

  // Fallback if auto-login fails
  return {
    user: {
      uuid: registerResponse.userId?.toString() || "",
      email: validatedInput.email,
      displayName: registerData.name,
      role: "user" as UserRole,
      token: "" // Will need to login manually
    }
  };
};
