import { db } from "../../helpers/db";
import { schema, OutputType } from "./redeem-points_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      const customer = await trx.selectFrom('customers')
        .where('id', '=', input.customerId)
        .select('totalPoints')
        .executeTakeFirst();

      if (!customer) {
        throw new Error(`Customer with ID ${input.customerId} not found.`);
      }

      if (customer.totalPoints === null || customer.totalPoints < input.pointsAmount) {
        throw new Error(`Insufficient points. Available: ${customer.totalPoints ?? 0}, Required: ${input.pointsAmount}.`);
      }

      const newTransaction = await trx.insertInto('pointsTransactions')
        .values({
          customerId: input.customerId,
          pointsAmount: -input.pointsAmount, // Store redeemed points as a negative value
          transactionType: 'redeemed',
          description: input.description,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const updatedCustomer = await trx.updateTable('customers')
        .set((eb) => ({
          totalPoints: eb('totalPoints', '-', input.pointsAmount),
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
    console.error("Error redeeming points:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to redeem points: ${errorMessage}` }), { status: 400 });
  }
}