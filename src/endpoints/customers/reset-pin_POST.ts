import { db } from "../../helpers/db";
import { schema, OutputType } from "./reset-pin_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import superjson from 'superjson';
import { ZodError } from "zod";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Find customer by email (case-insensitive) or phone.
    const customer = await db.selectFrom('customers')
      .select(['id', 'name'])
      .where(
        (eb) => eb.or([
          eb(sql`lower(email)`, '=', input.identifier.toLowerCase()),
          eb('phone', '=', input.identifier)
        ])
      )
      .executeTakeFirst();

    if (!customer) {
      // As per security best practices for reset flows, we return a generic success message
      // to prevent attackers from enumerating registered emails or phone numbers.
      console.log(`PIN reset attempt for non-existent identifier: ${input.identifier}`);
      const genericResponse: OutputType = {
        success: true,
        message: "If an account with that identifier exists, a PIN reset has been processed.",
      };
      return new Response(superjson.stringify(genericResponse), { status: 200 });
    }

    const pinHash = await generatePasswordHash(input.newPin);

    const updatedCustomer = await db.updateTable('customers')
      .set({
        pinHash,
        pinEnabled: true,
        pinSetAt: new Date(),
      })
      .where('id', '=', customer.id)
      .returning('id')
      .executeTakeFirst();

    if (!updatedCustomer) {
      throw new Error("Failed to update customer PIN after finding the customer.");
    }

    console.log(`Successfully reset PIN for customer ID: ${customer.id}`);

    const response: OutputType = {
      success: true,
      message: "PIN has been reset successfully.",
      customerName: customer.name,
    };

    return new Response(superjson.stringify(response), { status: 200 });

  } catch (error) {
    console.error("Error resetting customer PIN:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to reset PIN: ${errorMessage}` }), { status: 500 });
  }
}