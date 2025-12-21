import { db } from "../../helpers/db";
import { schema, OutputType } from "./lookup_POST.schema";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const customer = await db.selectFrom('customers')
      .select([
        'id',
        'uuid',
        'name',
        'firstName',
        'lastName',
        'mobile',
        'idNumber',
        'email',
        'customerNumber',
        'totalPoints',
        'lifetimePoints',
        'apartment',
        'locationId'
      ])
      .where((eb) => eb.or([
        eb('mobile', '=', input.identifier),
        eb('idNumber', '=', input.identifier)
      ]))
      .executeTakeFirst();

    if (!customer) {
      return new Response(superjson.stringify({ error: "Customer not found." }), { status: 404 });
    }

    const response: OutputType = customer;
    return new Response(superjson.stringify(response), { status: 200 });

  } catch (error) {
    console.error("Error looking up customer:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to look up customer: ${errorMessage}` }), { status: 500 });
  }
}