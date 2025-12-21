import { db } from "../../helpers/db";
import { schema, OutputType } from "./award-points_POST.schema";
import { type PointsTransactionType } from "../../helpers/schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      const customer = await trx.selectFrom('customers')
        .where('id', '=', input.customerId)
        .select(['totalPoints', 'lifetimePoints'])
        .executeTakeFirst();

      if (!customer) {
        throw new Error(`Customer with ID ${input.customerId} not found.`);
      }

      const newTransaction = await trx.insertInto('pointsTransactions')
        .values({
          customerId: input.customerId,
          pointsAmount: input.pointsAmount,
          transactionType: input.transactionType as PointsTransactionType,
          description: input.description ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const updatedCustomer = await trx.updateTable('customers')
        .set((eb) => ({
          totalPoints: eb('totalPoints', '+', input.pointsAmount),
          // Only add to lifetime points if it's a positive transaction type
          lifetimePoints: input.transactionType !== 'adjustment' || input.pointsAmount > 0 
            ? eb('lifetimePoints', '+', input.pointsAmount) 
            : eb.ref('lifetimePoints'),
        }))
        .where('id', '=', input.customerId)
        .returning(['totalPoints', 'lifetimePoints'])
        .executeTakeFirstOrThrow();

      return {
        transaction: newTransaction,
        customerPoints: {
          totalPoints: updatedCustomer.totalPoints,
          lifetimePoints: updatedCustomer.lifetimePoints,
        }
      };
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error awarding points:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to award points: ${errorMessage}` }), { status: 400 });
  }
}