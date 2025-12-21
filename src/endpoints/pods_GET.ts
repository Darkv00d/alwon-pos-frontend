import { db } from "../helpers/db";
import { schema, OutputType } from "./pods_GET.schema";
import superjson from "superjson";
import { jsonObjectFrom } from "kysely/helpers/postgres";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const stopId = url.searchParams.get("stopId");

    const input = schema.parse({ stopId: stopId ?? undefined });

    let query = db
      .selectFrom("pods")
      .selectAll("pods")
      .select((eb) => [
        jsonObjectFrom(
          eb
            .selectFrom("stops")
            .whereRef("stops.id", "=", "pods.stopId")
            .selectAll("stops")
        ).as("stop"),
      ]);

    if (input.stopId) {
      query = query.where("pods.stopId", "=", input.stopId);
    }

    const pods = await query.orderBy("pods.createdAt", "desc").execute();

    return new Response(superjson.stringify({ pods } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch pods:", error);
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