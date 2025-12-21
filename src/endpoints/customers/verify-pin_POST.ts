import { db } from "../../helpers/db";
import { schema, OutputType, VerifiedCustomer } from "./verify-pin_POST.schema";
import superjson from 'superjson';
import bcrypt from 'bcryptjs';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const customer = await db.selectFrom('customers')
      .selectAll()
      .where('id', '=', input.customerId)
      .executeTakeFirst();

    if (!customer) {
      return new Response(superjson.stringify({ error: "Customer not found." }), { status: 404 });
    }

    if (!customer.pinEnabled || !customer.pinHash) {
      const response: OutputType = { verified: false, reason: 'no_pin_set' };
      return new Response(superjson.stringify(response), { status: 200 });
    }

    const isMatch = await bcrypt.compare(input.pin, customer.pinHash);

    if (isMatch) {
      const verifiedCustomer: VerifiedCustomer = {
        id: customer.id,
        uuid: customer.uuid,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customerNumber: customer.customerNumber,
        totalPoints: customer.totalPoints,
        lifetimePoints: customer.lifetimePoints,
        firstName: customer.firstName,
        lastName: customer.lastName,
        mobile: customer.mobile,
        idNumber: customer.idNumber,
        idType: customer.idType,
        apartment: customer.apartment,
        locationId: customer.locationId,
      };
      const response: OutputType = { verified: true, customer: verifiedCustomer };
      return new Response(superjson.stringify(response), { status: 200 });
    } else {
      const response: OutputType = { verified: false, reason: 'incorrect_pin' };
      return new Response(superjson.stringify(response), { status: 200 });
    }

  } catch (error) {
    console.error("Error verifying customer PIN:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to verify PIN: ${errorMessage}` }), { status: 500 });
  }
}