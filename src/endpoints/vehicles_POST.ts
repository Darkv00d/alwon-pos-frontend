import { db } from "../helpers/db";
import { schema, OutputType } from "./vehicles_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let vehicle;
    const { id, ...vehicleData } = input;

    if (id) {
      // Update existing vehicle
      const updatedVehicles = await db
        .updateTable("vehicles")
        .set(vehicleData)
        .where("id", "=", id)
        .returningAll()
        .execute();
      
      if (updatedVehicles.length === 0) {
        return new Response(
          superjson.stringify({ error: `Vehicle with id ${id} not found.` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      vehicle = updatedVehicles[0];
      console.log(`Vehicle updated: ${vehicle.id}`);
    } else {
      // Create new vehicle
      vehicle = await db
        .insertInto("vehicles")
        .values(vehicleData)
        .returningAll()
        .executeTakeFirstOrThrow();
      console.log(`New vehicle created: ${vehicle.id}`);
    }

    return new Response(superjson.stringify({ vehicle } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating/updating vehicle:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}