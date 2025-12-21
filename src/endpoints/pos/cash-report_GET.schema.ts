import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  sessionId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  sessionId?: string;
  date?: string;
  reportGeneratedAt?: Date;
  period?: {
    start: Date;
    end: Date | null;
  };
  openedAt?: Date;
  closedAt?: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransactions: number;
  movementsIn: number;
  movementsOut: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
};

export const getCashReport = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const searchParams = new URLSearchParams();
  if (validatedInput.sessionId) {
    searchParams.set("sessionId", validatedInput.sessionId);
  }
  if (validatedInput.date) {
    searchParams.set("date", validatedInput.date);
  }

  const result = await fetch(`/_api/pos/cash-report?${searchParams.toString()}`, {
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
      throw new Error(errorObject.error || "Failed to fetch cash report");
    } catch (e) {
      throw new Error("An unexpected error occurred while fetching the cash report.");
    }
  }
  return superjson.parse<OutputType>(text);
};