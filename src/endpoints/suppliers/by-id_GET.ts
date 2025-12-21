import { db } from "../../helpers/db";
import { OutputType, schema } from "./by-id_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    const validatedParams = schema.safeParse({ id });

    if (!validatedParams.success) {
      return new Response(
        superjson.stringify({ error: "Invalid supplier ID provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supplierId = validatedParams.data.id;

    const supplier = await db
      .selectFrom("suppliers")
      .selectAll()
      .where("id", "=", supplierId)
      .executeTakeFirst();

    if (!supplier) {
      return new Response(
        superjson.stringify({ error: `Supplier with ID ${supplierId} not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      superjson.stringify({ supplier } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: `Failed to fetch supplier: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}