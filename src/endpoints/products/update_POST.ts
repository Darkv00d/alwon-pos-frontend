import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { id, ...updateData } = schema.parse(json);

    // Map camelCase field names from schema to actual database column names
    const dbUpdateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'imageUrl') {
        // Database column is 'imageurl' (lowercase, no underscore)
        dbUpdateData['imageurl'] = value;
      } else {
        // Other fields already match the database schema
        dbUpdateData[key] = value;
      }
    }

    if (Object.keys(dbUpdateData).length === 0) {
      return new Response(superjson.stringify({ error: "No update data provided." }), { status: 400 });
    }

    const updatedProduct = await db
      .updateTable('products')
      .set(dbUpdateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedProduct) {
      return new Response(superjson.stringify({ error: `Product with ID ${id} not found.` }), { status: 404 });
    }

    return new Response(superjson.stringify(updatedProduct satisfies OutputType));
  } catch (error) {
    console.error("Error updating product:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update product: ${errorMessage}` }), { status: 400 });
  }
}