import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type PointsTransactions, type Customers } from "../../helpers/schema";

export const schema = z.object({
  customerId: z.number().int().positive(),
  pointsAmount: z.number().int().positive("Points to redeem must be a positive number."),
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

export const postCustomersRedeemPoints = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/customers/redeem-points`, {
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