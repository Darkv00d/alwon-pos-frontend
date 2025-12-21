import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { id, ...updateData } = schema.parse(json);

    const updatedSupplier = await db
      .updateTable("suppliers")
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedSupplier) {
      return new Response(
        superjson.stringify({ error: "Supplier not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      superjson.stringify({ supplier: updatedSupplier } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating supplier:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to update supplier: ${errorMessage}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}