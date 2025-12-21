import { db } from '../helpers/db';
import { schema, OutputType } from "./pos-equipment_POST.schema";
import superjson from 'superjson';
import { ZodError } from 'zod';
import { nanoid } from 'nanoid';
import { Selectable } from 'kysely';
import { PosEquipment } from '../helpers/schema';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const { name, locationId, code, description, isActive } = validatedInput;

    // 1. Validate that the location exists
    const location = await db
      .selectFrom('locations')
      .select('id')
      .where('id', '=', locationId)
      .executeTakeFirst();

    if (!location) {
      return new Response(superjson.stringify({ error: `Location with ID ${locationId} not found.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Generate a unique code if not provided
    const equipmentCode = code || `POS-${nanoid(8).toUpperCase()}`;

    // 3. Insert the new POS equipment
    const newEquipment = await db
      .insertInto('posEquipment')
      .values({
        name,
        locationId,
        code: equipmentCode,
        description,
        isActive: isActive ?? true, // Default to active
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ equipment: newEquipment } satisfies OutputType), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error creating POS equipment:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data", details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create POS equipment: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}