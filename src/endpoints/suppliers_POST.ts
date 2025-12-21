import { db } from "../helpers/db";
import { schema, OutputType } from "./suppliers_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newSupplier = await db
      .insertInto("suppliers")
      .values({
        name: input.name,
        contactPerson: input.contactPerson,
        email: input.email,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
        taxId: input.taxId,
        idType: input.idType,
        paymentTermsType: input.paymentTermsType,
        creditDays: input.creditDays,
        leadTimeDays: input.leadTimeDays,
        defaultLocationId: input.defaultLocationId,
        isActive: input.isActive ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({ supplier: newSupplier } satisfies OutputType),
      {
        status: 201, // Created
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating supplier:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: `Failed to create supplier: ${errorMessage}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}