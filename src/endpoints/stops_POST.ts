import { db } from "../helpers/db";
import { schema, OutputType } from "./stops_POST.schema";
import superjson from "superjson";
import { nanoid } from "nanoid";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { id, ...stopData } = input;

    const stop = await db.transaction().execute(async (trx) => {
      if (id) {
        // Update existing stop
        const updatedStop = await trx
          .updateTable("stops")
          .set({
            ...stopData,
            // Kysely expects Date objects for timestamp columns
            windowFrom: stopData.windowFrom ? new Date(stopData.windowFrom) : null,
            windowTo: stopData.windowTo ? new Date(stopData.windowTo) : null,
          })
          .where("id", "=", id)
          .returningAll()
          .executeTakeFirstOrThrow();
        return updatedStop;
      } else {
        // Create new stop
        const newStop = await trx
          .insertInto("stops")
          .values({
            id: nanoid(),
            ...stopData,
            windowFrom: stopData.windowFrom ? new Date(stopData.windowFrom) : null,
            windowTo: stopData.windowTo ? new Date(stopData.windowTo) : null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        return newStop;
      }
    });

    return new Response(superjson.stringify({ stop } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create or update stop:", error);
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