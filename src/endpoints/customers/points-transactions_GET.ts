import { db } from "../../helpers/db";
import { schema, OutputType } from "./points-transactions_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const customerId = Number(url.searchParams.get('customerId'));

    const input = schema.parse({ customerId });

    const transactions = await db.selectFrom('pointsTransactions')
      .where('customerId', '=', input.customerId)
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    return new Response(superjson.stringify(transactions satisfies OutputType));
  } catch (error) {
    console.error("Error fetching points transactions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch points transactions: ${errorMessage}` }), { status: 500 });
  }
}