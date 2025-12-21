import { db } from "../../helpers/db";
import { schema, OutputType } from "./upsert_POST.schema";
import superjson from 'superjson';
import { type Products } from "../../helpers/schema";
import { type Insertable, type Updateable } from "kysely";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { id, ...data } = schema.parse(json);

    if (id) {
      // Update logic
      const updateData: Updateable<Products> = {
        ...data,
        updatedAt: new Date(),
      };

      const updatedProduct = await db
        .updateTable('products')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      if (!updatedProduct) {
        return new Response(
          superjson.stringify({ ok: false, error: `Product with ID ${id} not found.` } satisfies OutputType),
          { status: 404 }
        );
      }

      return new Response(
        superjson.stringify({ ok: true, product: updatedProduct } satisfies OutputType),
        { status: 200 }
      );
    } else {
      // Create logic
      const insertData: Insertable<Products> = {
        ...data,
        // Set defaults for non-optional fields if not provided
        price: data.price ?? '0',
        stockQuantity: data.stockQuantity ?? 0,
        minimumStock: data.minimumStock ?? 0,
      };

      const newProduct = await db
        .insertInto('products')
        .values(insertData)
        .returningAll()
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({ ok: true, product: newProduct } satisfies OutputType),
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error upserting product:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ ok: false, error: `Failed to upsert product: ${errorMessage}` } satisfies OutputType),
      { status: 400 }
    );
  }
}