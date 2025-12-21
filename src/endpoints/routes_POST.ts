import { db } from "../helpers/db";
import { schema, OutputType } from "./routes_POST.schema";
import superjson from "superjson";
import { withVehicle } from "../helpers/withVehicle";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let route;
    const { id, ...routeData } = input;

    if (id) {
      // Update existing route
      const updatedRoutes = await db
        .updateTable("routes")
        .set({
          ...routeData,
          date: routeData.date ? new Date(routeData.date) : null,
        })
        .where("id", "=", id)
        .returning('id')
        .execute();

      if (updatedRoutes.length === 0) {
        return new Response(
          superjson.stringify({ error: `Route with id ${id} not found.` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      route = await db.selectFrom('routes')
        .selectAll('routes')
        .select((eb) => [withVehicle(eb)])
        .where('id', '=', updatedRoutes[0].id)
        .executeTakeFirstOrThrow();

      console.log(`Route updated: ${route.id}`);
    } else {
      // Create new route
      const newRoute = await db
        .insertInto("routes")
        .values({
          ...routeData,
          date: routeData.date ? new Date(routeData.date) : null,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      route = await db.selectFrom('routes')
        .selectAll('routes')
        .select((eb) => [withVehicle(eb)])
        .where('id', '=', newRoute.id)
        .executeTakeFirstOrThrow();

      console.log(`New route created: ${route.id}`);
    }

    return new Response(superjson.stringify({ route } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating/updating route:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}