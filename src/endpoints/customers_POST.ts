import { db } from "../helpers/db";
import { schema, OutputType } from "./customers_POST.schema";
import superjson from 'superjson';
import { nanoid } from 'nanoid';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check for existing customer with the same email, mobile, or idNumber
    let query = db.selectFrom('customers').select('id');
    
    query = query.where(eb => eb.or([
      eb('email', '=', input.email),
      eb('mobile', '=', input.mobile),
      eb('idNumber', '=', input.idNumber)
    ]));
    
    const existingCustomer = await query.executeTakeFirst();

    if (existingCustomer) {
      throw new Error("A customer with this email, mobile number, or ID number already exists.");
    }

    const newCustomer = await db.insertInto('customers')
      .values({
        ...input,
        customerNumber: nanoid(10).toUpperCase(),
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        // Legacy name field - concatenate firstName and lastName
        name: `${input.firstName} ${input.lastName}`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newCustomer satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create customer: ${errorMessage}` }), { status: 400 });
  }
}