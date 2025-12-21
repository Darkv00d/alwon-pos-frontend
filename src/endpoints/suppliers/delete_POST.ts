import { db } from "../../helpers/db";
import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { id } = schema.parse(json);

    // Check if any products are associated with this supplier
    const associatedProduct = await db
      .selectFrom("products")
      .where("supplierId", "=", id)
      .select("id")
      .limit(1)
      .executeTakeFirst();

    if (associatedProduct) {
      return new Response(
        superjson.stringify({
          error: "Cannot delete supplier. It is associated with one or more products.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } } // 409 Conflict
      );
    }

    const deleteResult = await db
      .deleteFrom("suppliers")
      .where("id", "=", id)
      .executeTakeFirst();

    if (deleteResult.numDeletedRows === 0n) {
        return new Response(
            superjson.stringify({ error: "Supplier not found." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting supplier:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to delete supplier: ${errorMessage}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}