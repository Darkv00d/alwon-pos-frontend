import { db } from "../../../helpers/db";
import { schema, OutputType } from "./apply_POST.schema";
import { verifyAdminToken } from "../../../helpers/auth";
import superjson from "superjson";
import { type Transaction } from "kysely";
import { type DB } from "../../../helpers/schema";

type SuggestionGroup = {
  supplierId: number;
  locationId: number;
  items: { productId: number; qty: number }[];
};

async function createPurchaseOrderFromSuggestions(
  trx: Transaction<DB>,
  group: SuggestionGroup
) {
  const { supplierId, locationId, items } = group;

  const supplier = await trx
    .selectFrom("suppliers")
    .select(["leadTimeDays"])
    .where("id", "=", supplierId)
    .executeTakeFirstOrThrow();

  const products = await trx
    .selectFrom("products")
    .select(["id", "price"])
    .where("id", "in", items.map((item) => item.productId))
    .execute();

  const productPriceMap = new Map(
    products.map((p) => [p.id, parseFloat(p.price)])
  );

  let subtotal = 0;
  const poItemsToInsert = items.map((item) => {
    const unitPrice = productPriceMap.get(item.productId);
    if (unitPrice === undefined) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    const itemSubtotal = unitPrice * item.qty;
    subtotal += itemSubtotal;

    return {
      productId: item.productId,
      qty: item.qty,
      unitPrice: unitPrice.toString(),
      taxRate: "0", // Assuming 0 tax for auto-generated POs
    };
  });

  const total = subtotal; // Assuming no tax

  let expectedDate = new Date();
  if (supplier.leadTimeDays) {
    expectedDate.setDate(expectedDate.getDate() + supplier.leadTimeDays);
  }

  const newPurchaseOrder = await trx
    .insertInto("purchaseOrders")
    .values({
      supplierId,
      locationId,
      expectedDate,
      subtotal: subtotal.toString(),
      tax: "0",
      total: total.toString(),
      status: "sent",
      notes: "Auto-generated from reorder suggestion.",
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await trx
    .insertInto("purchaseOrderItems")
    .values(
      poItemsToInsert.map((item) => ({
        ...item,
        poId: newPurchaseOrder.id,
      }))
    )
    .execute();

  return newPurchaseOrder.id;
}

export async function handle(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let json;
    try {
      const requestText = await request.text();
      json = JSON.parse(requestText);
    } catch (error) {
      return new Response(
        superjson.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const { suggestionIds } = schema.parse(json);

    if (suggestionIds.length === 0) {
      return new Response(
        superjson.stringify({ error: "suggestionIds cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const createdPOs: OutputType["createdPOs"] = [];

    await db.transaction().execute(async (trx) => {
      const suggestions = await trx
        .selectFrom("reordersuggestions")
        .select([
          "id",
          "productid",
          "suggestedqty",
          "supplierid",
          "locationid",
        ])
        .where("id", "in", suggestionIds)
        .where("status", "=", "open")
        .execute();

      if (suggestions.length !== suggestionIds.length) {
        throw new Error("One or more suggestions are invalid, not 'open', or do not exist.");
      }
      
      const suggestionsByGroup = new Map<string, SuggestionGroup>();

      for (const s of suggestions) {
        if (!s.supplierid) {
            throw new Error(`Suggestion ID ${s.id} for product ID ${s.productid} is missing a supplier.`);
        }
        const key = `${s.supplierid}-${s.locationid}`;
        if (!suggestionsByGroup.has(key)) {
          suggestionsByGroup.set(key, {
            supplierId: s.supplierid,
            locationId: s.locationid,
            items: [],
          });
        }
        suggestionsByGroup.get(key)!.items.push({
          productId: s.productid,
          qty: Math.ceil(parseFloat(s.suggestedqty)),
        });
      }

      for (const group of suggestionsByGroup.values()) {
        const poId = await createPurchaseOrderFromSuggestions(trx, group);
        createdPOs.push({
          poId,
          supplierId: group.supplierId,
          locationId: group.locationId,
          itemsCount: group.items.length,
        });
      }

      await trx
        .updateTable("reordersuggestions")
        .set({ status: "applied" })
        .where("id", "in", suggestionIds)
        .execute();
    });

    return new Response(
      superjson.stringify({ ok: true, createdPOs } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to apply reorder suggestions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: `Failed to apply suggestions: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}