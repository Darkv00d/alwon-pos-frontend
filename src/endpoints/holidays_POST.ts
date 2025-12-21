import { db } from "../helpers/db";
import { schema, type OutputType } from "./holidays_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    if (input.action === 'add') {
      const newHoliday = await db.insertInto('holidays')
        .values(input.payload)
        .returningAll()
        .executeTakeFirstOrThrow();
      return new Response(superjson.stringify(newHoliday satisfies OutputType));
    } else if (input.action === 'delete') {
      const deletedHoliday = await db.deleteFrom('holidays')
        .where('name', '=', input.payload.name)
        .where('date', '=', input.payload.date)
        .returningAll()
        .executeTakeFirstOrThrow();
      return new Response(superjson.stringify(deletedHoliday satisfies OutputType));
    }

    return new Response(superjson.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error("Error processing holiday:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to process holiday: ${errorMessage}` }), { status: 500 });
  }
}