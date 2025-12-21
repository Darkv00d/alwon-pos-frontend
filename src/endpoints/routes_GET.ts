import { db } from "../helpers/db";
import { schema, OutputType } from "./routes_GET.schema";
import superjson from "superjson";
import { withVehicle } from "../helpers/withVehicle";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { date, vehicleId, status } = schema.parse(params);

    let query = db.selectFrom("routes").selectAll('routes').select((eb) => [withVehicle(eb)]);

    if (date) {
      // Assuming date is in 'YYYY-MM-DD' format. Kysely requires a Date object for timestamp comparison.
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      query = query.where("routes.date", ">=", startDate).where("routes.date", "<=", endDate);
    }

    if (vehicleId) {
      query = query.where("routes.vehicleId", "=", vehicleId);
    }

    if (status) {
      query = query.where("routes.status", "=", status);
    }

    const routes = await query.execute();

    return new Response(superjson.stringify({ routes } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}