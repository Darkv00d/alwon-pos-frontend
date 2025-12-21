import { db } from "../../helpers/db";
import { OutputType } from "./categories-list_GET.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin' && user.role !== 'manager') {
      return new Response(superjson.stringify({ error: "Forbidden: You do not have permission to view this resource." }), { status: 403 });
    }

    // This query efficiently fetches all categories and nests their subcategories
    // into a JSON array in a single database roundtrip.
    const categories = await db
      .selectFrom('categories')
      .selectAll('categories')
      .select((eb) => [
        jsonArrayFrom(
          eb.selectFrom('subcategories')
            .selectAll()
            .whereRef('subcategories.categoryId', '=', 'categories.id')
            .orderBy('subcategories.name', 'asc')
        ).as('subcategories')
      ])
      .orderBy('categories.name', 'asc')
      .execute();

    return new Response(superjson.stringify({ categories } satisfies OutputType), { status: 200 });

  } catch (error) {
    console.error("Error fetching categories list:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch categories: ${errorMessage}` }), { status: 500 });
  }
}