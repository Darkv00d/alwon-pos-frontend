import { db } from "../helpers/db";
import { type OutputType } from "./departments_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const departments = await db
      .selectFrom('departments')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return new Response(superjson.stringify(departments satisfies OutputType));
  } catch (error) {
    console.error("Error fetching departments:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch departments: ${errorMessage}` }), { status: 500 });
  }
}