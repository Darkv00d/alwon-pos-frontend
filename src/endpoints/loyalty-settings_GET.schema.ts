import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type LoyaltySettings } from "../helpers/schema";

// No input schema needed for a simple GET all request.
export type OutputType = Selectable<LoyaltySettings>[];

export const getLoyaltySettings = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/loyalty-settings`, {
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