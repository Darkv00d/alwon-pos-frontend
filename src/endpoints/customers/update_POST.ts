import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { id, pinEnabled, pinHash, ...updateData } = schema.parse(json);

    // Check if customer exists
    const customer = await db.selectFrom('customers').where('id', '=', id).select('id').executeTakeFirst();
    if (!customer) {
      return new Response(superjson.stringify({ error: `Customer with ID ${id} not found.` }), { status: 404 });
    }

    if (Object.keys(updateData).length === 0 && pinEnabled === undefined && pinHash === undefined) {
      return new Response(superjson.stringify({ error: "No update data provided." }), { status: 400 });
    }

    // Build the update object
    const updateObject: any = {
      ...updateData,
      dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : updateData.dateOfBirth,
      updatedAt: new Date(),
    };

    // If firstName or lastName is being updated, update the legacy name field
    if (updateData.firstName || updateData.lastName) {
      const currentCustomer = await db.selectFrom('customers')
        .where('id', '=', id)
        .select(['firstName', 'lastName'])
        .executeTakeFirstOrThrow();
      
      const firstName = updateData.firstName ?? currentCustomer.firstName ?? '';
      const lastName = updateData.lastName ?? currentCustomer.lastName ?? '';
      updateObject.name = `${firstName} ${lastName}`;
    }

    // Handle PIN enable/disable logic
    if (pinEnabled !== undefined) {
      updateObject.pinEnabled = pinEnabled;
      
      // If disabling PIN, clear all PIN-related fields
      if (pinEnabled === false) {
        updateObject.pinHash = null;
        updateObject.pinSetAt = null;
      }
    }

    // Allow setting pinHash directly (used when setting a new PIN through update)
    if (pinHash !== undefined && pinHash !== null) {
      updateObject.pinHash = pinHash;
    }

    const updatedCustomer = await db.updateTable('customers')
      .set(updateObject)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedCustomer satisfies OutputType));
  } catch (error) {
    console.error("Error updating customer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update customer: ${errorMessage}` }), { status: 400 });
  }
}