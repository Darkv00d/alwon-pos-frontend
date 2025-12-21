import { db } from "../../helpers/db";
import { schema, OutputType } from "./categories_upsert_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { ZodError } from "zod";
import { Selectable } from "kysely";
import { Categories, Subcategories } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin' && user.role !== 'manager') {
      return new Response(superjson.stringify({ error: "Forbidden: You do not have permission to perform this action." }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const { categoryName, subcategoryName } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // Step 1: Insert the category if it doesn't exist.
      await trx
        .insertInto('categories')
        .values({ name: categoryName })
        .onConflict(oc => oc.column('name').doNothing())
        .execute();

      // Step 2: Retrieve the category (either newly inserted or existing).
      const category = await trx
        .selectFrom('categories')
        .selectAll()
        .where('name', '=', categoryName)
        .executeTakeFirstOrThrow();

      let subcategory: Selectable<Subcategories> | undefined = undefined;
      let message = "Category processed successfully.";

      // Step 3: If a subcategory name is provided, insert it.
      if (subcategoryName) {
        const subcategoryInsertResult = await trx
          .insertInto('subcategories')
          .values({ name: subcategoryName, categoryId: category.id })
          .onConflict(oc => oc.columns(['name', 'categoryId']).doNothing())
          .returningAll()
          .executeTakeFirst();
        
        if (subcategoryInsertResult) {
            subcategory = subcategoryInsertResult;
            message = "Category and subcategory created successfully.";
        } else {
            // If insert did nothing, fetch the existing subcategory to return it
            subcategory = await trx
                .selectFrom('subcategories')
                .selectAll()
                .where('name', '=', subcategoryName)
                .where('categoryId', '=', category.id)
                .executeTakeFirstOrThrow();
            message = "Category processed and subcategory already existed.";
        }
      }

      return { category, subcategory, message };
    });

    return new Response(superjson.stringify({ 
      success: true, 
      message: result.message, 
      category: result.category,
      subcategory: result.subcategory,
    } satisfies OutputType), { status: 200 });

  } catch (error) {
    console.error("Error managing categories:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to manage categories: ${errorMessage}` }), { status: 500 });
  }
}