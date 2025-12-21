import superjson from "superjson";
import { db } from "../../../helpers/db";
import { withAuth } from "../../../helpers/withAuth";
import { schema, OutputType } from "./sales_summary_GET.schema";
import { Kysely } from "kysely";
import { DB } from "../../../helpers/schema";

export const handle = withAuth(async (req: Request, user) => {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Unauthorized: Admin access required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const input = schema.parse({
      from: req.headers.get("X-Date-From"),
      to: req.headers.get("X-Date-To"),
      locationIds: req.headers.get("X-Location-Ids"),
    });

    const { from, to, locationIds } = input;

    let query = db
      .selectFrom("transactions")
      .select(({ fn }) => [
        "locationId",
        fn.sum("totalAmount").as("total"),
        fn.count("id").as("tickets"),
      ])
      .where("locationId", "is not", null)
      .groupBy("locationId");

    if (from) {
      query = query.where("createdAt", ">=", from);
    }
    if (to) {
      const toDate = new Date(to);
      // Use end of day to make the range inclusive
      toDate.setHours(23, 59, 59, 999);
      query = query.where("createdAt", "<=", toDate);
    }

    if (locationIds && locationIds.length > 0) {
      query = query.where("locationId", "in", locationIds);
    }

    const summaryData = await query.execute();

    const response: OutputType = {
      ok: true,
      summary: summaryData.map((row) => ({
        locationId: row.locationId!, // Already filtered out nulls
        total: String(row.total ?? "0"),
        tickets: String(row.tickets),
      })),
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sales summary report:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});