import { db } from "../../helpers/db";
import superjson from "superjson";
import { schema, OutputType } from "./list_GET.schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = {
      q: url.searchParams.get("q") ?? undefined,
    };

    const { q } = schema.parse(queryParams);

    let query = db
      .selectFrom("products")
      .select([
        "id",
        "uuid",
        "name",
        "sku",
        "barcode",
        "price",
        "cost",
        "categoryId",
        "subcategoryId",
        "preferredSupplierId",
        "imageurl",
        "isActive",
      ])
      .orderBy("name", "asc");

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", searchTerm),
          eb("sku", "ilike", searchTerm),
          eb("barcode", "ilike", searchTerm),
        ])
      );
    }

    const products = await query.execute();

    return new Response(
      superjson.stringify({ ok: true, products } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching product list:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ ok: false, error: errorMessage } satisfies OutputType),
      { status: 400 }
    );
  }
}