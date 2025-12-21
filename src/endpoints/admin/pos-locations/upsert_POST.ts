import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./upsert_POST.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { id, ...data } = input;

    if (id) {
      // Update existing POS location
      const updated = await db
        .updateTable("locations")
        .set({ ...data, updatedAt: new Date() })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();

      if (!updated) {
        return new Response(
          superjson.stringify({ error: `POS Location with ID ${id} not found.` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        superjson.stringify({
          ok: true,
          message: "POS Location updated successfully.",
          posLocation: updated,
        } satisfies OutputType),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Create new POS location
      const created = await db
        .insertInto("locations")
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({
          ok: true,
          message: "POS Location created successfully.",
          posLocation: created,
        } satisfies OutputType),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error upserting POS location:", error);
    if (error instanceof ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to upsert POS location: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}