import superjson from "superjson";
import { db } from '../../helpers/db';
import { schema, OutputType } from "./summary_GET.schema";
import { withAuth } from '../../helpers/withAuth';

export const handle = withAuth(async (req: Request, _user) => {
  try {
    const url = new URL(req.url);
    const input = schema.parse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      locationIds: url.searchParams.get("locationIds")
    });

    const { from, to, locationIds } = input;

    let query = db.
    selectFrom("transactions").
    leftJoin("locations", "locations.id", "transactions.locationId").
    select(({ fn, val }) => [
    "transactions.locationId",
    // Use coalesce to provide a default name for null locationId
    fn.coalesce("locations.name", val("Unknown Location")).as("locationName"),
    fn.sum("transactions.totalAmount").as("total"),
    fn.count("transactions.id").as("tickets")]
    ).
    groupBy(["transactions.locationId", "locations.name"]).
    orderBy("locationName", "asc");

    if (from) {
      query = query.where("transactions.createdAt", ">=", from);
    }
    if (to) {
      // Add 1 day to 'to' date to make the range inclusive of the end date
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.where("transactions.createdAt", "<", toDate);
    }

    if (locationIds && locationIds.length > 0) {
      query = query.where("transactions.locationId", "in", locationIds);
    }

    const summary = await query.execute();

    // Kysely returns count as bigint and sum of numeric as string | number | bigint.
    // Convert both to strings to match OutputType schema.
    const response: OutputType = summary.map((row) => ({
      ...row,
      // Ensure both total and tickets are strings
      total: String(row.total),
      tickets: String(row.tickets)
    }));

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});