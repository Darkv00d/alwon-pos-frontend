import { db } from "../../../helpers/db";
import { schema, type OutputType } from "./stock_GET.schema";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const locationIdsHeader = request.headers.get("x-location-ids");

    const validatedInput = schema.parse({
      productId: productId ? Number(productId) : undefined,
      locationIds: locationIdsHeader ?? undefined,
    });

    const locationIds = validatedInput.locationIds
      ? validatedInput.locationIds.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id))
      : [];

    let query = db.selectFrom("stockMovements")
      .select(({ fn }) => [
        "productId",
        "locationId",
        fn.sum("qty").as("qty")
      ])
      .where('productId', 'is not', null)
      .where('locationId', 'is not', null)
      .groupBy(["productId", "locationId"]);

    if (validatedInput.productId) {
      query = query.where("productId", "=", validatedInput.productId);
    }

    if (locationIds.length > 0) {
      query = query.where("locationId", "in", locationIds);
    }

    const stockLevels = await query.execute();

    const result: OutputType = {
      ok: true,
      stock: stockLevels.map(item => ({
        productId: item.productId!,
        locationId: item.locationId!,
        // Kysely returns sum of Numeric as string
        qty: item.qty ? parseFloat(String(item.qty)) : 0,
      })),
    };

    return new Response(superjson.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching admin stock levels:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ ok: false, error: "Invalid input", issues: error.issues }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ ok: false, error: `Failed to fetch stock levels: ${errorMessage}` }), { status: 500 });
  }
}