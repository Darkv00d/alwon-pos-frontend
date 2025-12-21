import { db } from "../helpers/db";
import { OutputType } from "./categories_GET.schema";
import superjson from 'superjson';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export async function handle(request: Request) {
  try {
    // This query efficiently fetches all categories and nests their subcategories
    // into a JSON array in a single database roundtrip.
    const categories = await db
      .selectFrom('categories')
      .select(['id', 'name'])
      .select((eb) => [
        jsonArrayFrom(
          eb.selectFrom('subcategories')
            .select(['id', 'name'])
            .whereRef('subcategories.categoryId', '=', 'categories.id')
            .orderBy('subcategories.name', 'asc')
        ).as('subs')
      ])
      .orderBy('categories.name', 'asc')
      .execute();

    return new Response(superjson.stringify({ ok: true, categories } satisfies OutputType), { status: 200 });

  } catch (error) {
    console.error("Error fetching public categories list:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // Note: The OutputType allows for an error response, but for a simple public GET,
    // a generic 500 is sufficient. The client helper will throw an error on non-ok responses.
    return new Response(superjson.stringify({ error: `Failed to fetch categories: ${errorMessage}` }), { status: 500 });
  }
}