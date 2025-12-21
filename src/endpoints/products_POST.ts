import { db } from "../helpers/db";
import { schema, OutputType } from "./products_POST.schema";
import superjson from 'superjson';
import { type Insertable } from "kysely";
import { type Products } from "../helpers/schema";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    // Map camelCase field names from schema to actual database column names
    const { imageUrl, ...rest } = validatedInput;

    const dbInsertData: Insertable<Products> = {
      ...rest,
      imageurl: imageUrl ?? null,
    };

    const newProduct = await db
      .insertInto('products')
      .values(dbInsertData)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newProduct satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create product: ${errorMessage}` }), { status: 400 });
  }
}