import { db } from "../../../helpers/db";
import { schema, OutputType } from "./suggestions_GET.schema";
import { verifyAdminToken } from "../../../helpers/auth";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const locationIdsHeader = request.headers.get("X-Location-Ids");

    const locationIds = locationIdsHeader
      ? locationIdsHeader.split(",").map((id) => parseInt(id.trim(), 10)).filter(Number.isInteger)
      : [];

    let query = db
      .selectFrom("reordersuggestions")
      .innerJoin("products", "products.id", "reordersuggestions.productid")
      .innerJoin("locations", "locations.id", "reordersuggestions.locationid")
      .leftJoin("suppliers", "suppliers.id", "reordersuggestions.supplierid")
      .select([
        "reordersuggestions.id",
        "reordersuggestions.status",
        "reordersuggestions.suggestedqty as suggestedQty",
        "reordersuggestions.currentstock as currentStock",
        "reordersuggestions.demanddaily as demandDaily",
        "reordersuggestions.rop",
        "reordersuggestions.targetstock as targetStock",
        "reordersuggestions.createdat as createdAt",
        "products.id as productId",
        "products.name as productName",
        "products.sku as productSku",
        "products.price as productPrice",
        "locations.id as locationId",
        "locations.name as locationName",
        "suppliers.id as supplierId",
        "suppliers.name as supplierName",
      ])
      .orderBy("reordersuggestions.suggestedqty", "desc");

    if (status) {
      query = query.where("reordersuggestions.status", "=", status);
    }

    if (locationIds.length > 0) {
      query = query.where("reordersuggestions.locationid", "in", locationIds);
    }

    const suggestions = await query.execute();
    
    const formattedSuggestions = suggestions.map(s => ({
      ...s,
      suggestedQty: parseFloat(s.suggestedQty),
      currentStock: s.currentStock ? parseFloat(s.currentStock) : 0,
      demandDaily: s.demandDaily ? parseFloat(s.demandDaily) : 0,
      rop: s.rop ? parseFloat(s.rop) : 0,
      targetStock: s.targetStock ? parseFloat(s.targetStock) : 0,
      productPrice: s.productPrice ? parseFloat(s.productPrice) : 0,
    }));

    return new Response(superjson.stringify(formattedSuggestions satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to get reorder suggestions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: `Failed to get reorder suggestions: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}