import superjson from "superjson";
import { db } from "../../../helpers/db";
import { withAuth } from "../../../helpers/withAuth";
import { schema, OutputType } from "./sales_by_location_GET.schema";
import { sql } from "kysely";

export const handle = withAuth(async (req: Request, user) => {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Unauthorized: Admin access required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const locationIdsParam = url.searchParams.get("locationIds");

    const input = schema.parse({
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
      locationIds: locationIdsParam ? locationIdsParam.split(',').map(Number) : undefined,
    });

    const { startDate, endDate, locationIds } = input;

    let query = db
      .selectFrom("locations as l")
      .leftJoin("transactions as t", "t.locationId", "l.id")
      .select(({ fn }) => [
        "l.id as locationId",
        "l.name as locationName",
        fn.count<string>("t.id").as("totalTransactions"),
        sql<string>`SUM(t.total_amount)`.as("totalSales"),
        sql<string>`AVG(t.total_amount)`.as("averageTicket"),
        fn.min("t.createdAt").as("firstSale"),
        fn.max("t.createdAt").as("lastSale"),
      ])
      .groupBy(["l.id", "l.name"])
      .orderBy(sql`total_sales desc nulls last`);

    if (startDate) {
      query = query.where("t.createdAt", ">=", startDate);
    }
    if (endDate) {
      const toDate = new Date(endDate);
      toDate.setHours(23, 59, 59, 999); // Inclusive end date
      query = query.where("t.createdAt", "<=", toDate);
    }

    if (locationIds && locationIds.length > 0) {
      query = query.where("l.id", "in", locationIds);
    }

    const reportData = await query.execute();

    const response: OutputType = {
      success: true,
      data: reportData.map((row) => ({
        locationId: row.locationId,
        locationName: row.locationName,
        totalTransactions: Number(row.totalTransactions ?? 0),
        totalSales: Number(row.totalSales ?? 0),
        averageTicket: Number(row.averageTicket ?? 0),
        firstSale: row.firstSale ? new Date(row.firstSale) : null,
        lastSale: row.lastSale ? new Date(row.lastSale) : null,
      })),
      period: {
        startDate: startDate?.toISOString().split("T")[0] ?? null,
        endDate: endDate?.toISOString().split("T")[0] ?? null,
      },
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sales by location report:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});