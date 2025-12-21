import { db } from "../../../helpers/db";
import { type InputType, type OutputType, schema } from "./upsert_POST.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import superjson from 'superjson';
import { ZodError } from "zod";
import { type Selectable } from "kysely";
import { type Locations } from "../../../helpers/schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse<InputType>(await request.text());
    const locationData = schema.parse(json);
    const { id, ...dataToUpsert } = locationData;

    let savedLocation: Selectable<Locations>;
    let message: string;

    if (id) {
      // Update existing location
      const updatedLocation = await db.updateTable('locations')
        .set({ ...dataToUpsert, updatedAt: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
      
      savedLocation = updatedLocation;
      message = "Location updated successfully.";
      console.log(`User ${user.uuid} updated location ${id}`);
    } else {
      // Create new location
      const newLocation = await db.insertInto('locations')
        .values(dataToUpsert)
        .returningAll()
        .executeTakeFirstOrThrow();
      
      savedLocation = newLocation;
      message = "Location created successfully.";
      console.log(`User ${user.uuid} created new location ${newLocation.id}`);
    }

    return new Response(superjson.stringify({ message, location: savedLocation } satisfies OutputType));

  } catch (error) {
    console.error("Error upserting inventory location:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to save location: ${errorMessage}` }), { status: 500 });
  }
}