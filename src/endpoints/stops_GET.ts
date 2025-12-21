import { db } from "../helpers/db";
import { schema, OutputType } from "./stops_GET.schema";
import superjson from "superjson";
import { withVehicle } from "../helpers/withVehicle";
import { jsonObjectFrom } from "kysely/helpers/postgres";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const routeId = url.searchParams.get("routeId");

    const input = schema.parse({ routeId: routeId ?? undefined });

    let query = db
      .selectFrom("stops")
      .selectAll("stops")
      .select((eb) => [
        jsonObjectFrom(
          eb
            .selectFrom("routes")
            .whereRef("routes.id", "=", "stops.routeId")
            .selectAll("routes")
            .select((ebRoutes) => withVehicle(ebRoutes))
        ).as("route"),
      ]);

    if (input.routeId) {
      query = query.where("stops.routeId", "=", input.routeId);
    }

    const stops = await query.orderBy("stops.orderNo", "asc").execute();

    return new Response(superjson.stringify({ stops } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch stops:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}