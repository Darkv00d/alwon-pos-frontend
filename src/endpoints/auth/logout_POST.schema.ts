import { z } from "zod";

// No input required for logout
export const schema = z.object({});

export type OutputType =
  | {
    success: boolean;
    message: string;
  }
  | {
    error: string;
    message?: string;
  };

export const postLogout = async (
  body: z.infer<typeof schema> = {},
  init?: RequestInit
): Promise<OutputType> => {
  // For JWT-based auth, logout is client-side only
  // Token is removed from localStorage in useAuth.tsx
  // Backend Java doesn't need a logout endpoint for stateless JWT
  return {
    success: true,
    message: "Logged out successfully"
  };
};
