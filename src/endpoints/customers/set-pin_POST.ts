import { db } from "../../helpers/db";
import { schema, OutputType } from "./set-pin_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const customer = await db.selectFrom('customers')
      .select('id')
      .where('id', '=', input.customerId)
      .executeTakeFirst();

    if (!customer) {
      return new Response(superjson.stringify({ error: "Customer not found." }), { status: 404 });
    }

    const pinHash = await generatePasswordHash(input.pin);

    const updatedCustomer = await db.updateTable('customers')
      .set({
        pinHash,
        pinEnabled: true,
        pinSetAt: new Date(),
      })
      .where('id', '=', input.customerId)
      .returning('id')
      .executeTakeFirst();

    if (!updatedCustomer) {
      // This case should be rare given the check above, but it's good practice.
      throw new Error("Failed to update customer PIN.");
    }

    const response: OutputType = {
      success: true,
      message: "PIN has been set successfully.",
    };

    return new Response(superjson.stringify(response), { status: 200 });

  } catch (error) {
    console.error("Error setting customer PIN:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to set PIN: ${errorMessage}` }), { status: 500 });
  }
}