import { schema, OutputType } from "./stock-available_GET.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { sql } from 'kysely';

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const productUuid = url.searchParams.get('productUuid');
    const locationId = url.searchParams.get('locationId');

    const validatedInput = schema.parse({
      productUuid,
      locationId: locationId ? Number(locationId) : undefined,
    });

    const result = await db.selectFrom('stockMovements')
      .select(db.fn.sum('qty').as('totalQty'))
      .where('productUuid', '=', validatedInput.productUuid)
      .where('locationId', '=', validatedInput.locationId)
      .executeTakeFirst();

    // The sum of a numeric column can be null if there are no rows.
    // The result from kysely for sum on a numeric column is a string.
    const availableStock = Number(result?.totalQty ?? 0);

    return new Response(superjson.stringify({ availableStock } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching available stock:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}