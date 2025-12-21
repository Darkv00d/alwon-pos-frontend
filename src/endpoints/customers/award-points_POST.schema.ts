import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type PointsTransactions, type Customers, PointsTransactionTypeArrayValues } from "../../helpers/schema";

const allowedAwardTypes = ['bonus', 'adjustment', 'earned'] as const;

export const schema = z.object({
  customerId: z.number().int().positive(),
  pointsAmount: z.number().int(), // Can be negative for adjustments
  transactionType: z.enum(allowedAwardTypes),
  description: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  transaction: Selectable<PointsTransactions>;
  customerPoints: {
    totalPoints: Selectable<Customers>['totalPoints'];
    lifetimePoints: Selectable<Customers>['lifetimePoints'];
  };
};

export const postCustomersAwardPoints = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/award-points`, {
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