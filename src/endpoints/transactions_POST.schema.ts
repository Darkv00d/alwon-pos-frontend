import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Transactions, type TransactionItems, PaymentMethodArrayValues } from "../helpers/schema";

export const TransactionItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be at least 1."),
});

export const schema = z.object({
  payments: z.array(z.object({
    method: z.enum(PaymentMethodArrayValues),
    amount: z.number().positive(),
    pointsAmount: z.number().int().positive().optional(),
    cardTransactionId: z.string().optional(),
  })).min(1, "Transaction must include at least one payment method."),
  customerId: z.number().int().positive().optional(),
  items: z.array(TransactionItemSchema).min(1, "Transaction must include at least one item."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Transactions> & {
  items: Selectable<TransactionItems>[];
};

export const postTransactions = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);

  // Get API URL from env.json if possible, or fallback
  let API_URL = 'http://localhost:8080/api';
  try {
    const envResponse = await fetch('/env.json');
    const env = await envResponse.json();
    if (env.API_URL) API_URL = env.API_URL;
  } catch (e) {
    console.warn("Could not load env.json, using fallback URL");
  }

  // Get token for authorization
  const token = localStorage.getItem('alwon_auth_token');

  const result = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    body: JSON.stringify(validatedInput), // Use standard JSON.stringify
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const text = await result.text();
    try {
      const errorObject = JSON.parse(text);
      throw new Error(errorObject.error || "Transaction failed");
    } catch (e) {
      throw new Error(`Transaction failed: ${text}`);
    }
  }

  return await result.json();
};