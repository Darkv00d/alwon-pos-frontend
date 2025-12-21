import { db } from "../helpers/db";
import { schema, type OutputType } from "./product-lots_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { id, ...lotData } = input;

    let lot: OutputType;

    if (id) {
      // Update existing lot
      lot = await db.updateTable('productLots')
        .set(lotData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      // Create new lot
      lot = await db.insertInto('productLots')
        .values({
          ...lotData,
          id: nanoid(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return new Response(superjson.stringify(lot satisfies OutputType), { status: id ? 200 : 201 });
  } catch (error) {
    console.error("Error creating/updating product lot:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to process product lot: ${errorMessage}` }), { status: 400 });
  }
}