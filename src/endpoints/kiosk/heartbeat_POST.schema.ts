import { z } from "zod";

export const schema = z.object({
  locationId: z.number().int().positive(),
  deviceCode: z.string().min(1),
});

export type OutputType =
  | {
      success: true;
      kiosk: {
        id: number;
        name: string;
        locationId: number;
      };
    }
  | {
      error: string;
      details?: unknown;
    };

export const postKioskHeartbeat = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  try {
    const result = await fetch(`/_api/kiosk/heartbeat`, {
      method: "POST",
      body: JSON.stringify(body),
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!result.ok) {
      const errorText = await result.text();
      return { error: `Server responded with ${result.status}: ${errorText}` };
    }
    return result.json();
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
};