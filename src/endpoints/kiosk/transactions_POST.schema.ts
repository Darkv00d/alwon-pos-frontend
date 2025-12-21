import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Transactions, type TransactionItems, PaymentMethodArrayValues } from "../../helpers/schema";

export const TransactionItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be at least 1."),
});

export const schema = z.object({
  paymentMethod: z.enum(PaymentMethodArrayValues),
  customerId: z.number().int().positive().optional(),
  items: z.array(TransactionItemSchema).min(1, "Transaction must include at least one item."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Transactions> & {
  items: Selectable<TransactionItems>[];
};

export const postKioskTransactions = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/kiosk/transactions`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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