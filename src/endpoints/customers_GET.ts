import { db } from "../helpers/db";
import { schema, OutputType } from "./customers_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const isActive = url.searchParams.get('isActive') === 'true' ? true : url.searchParams.get('isActive') === 'false' ? false : undefined;

    // This is a way to parse query params without a schema, as GET requests in Floot don't have body schemas.
    const input = schema.parse({ search, isActive });

    let query = db.selectFrom('customers')
      .leftJoin('customerTiers', 'customers.tierId', 'customerTiers.id')
      .select([
        'customers.id',
        'customers.name',
        'customers.firstName',
        'customers.lastName',
        'customers.idType',
        'customers.idNumber',
        'customers.email',
        'customers.phone',
        'customers.mobile',
        'customers.customerNumber',
        'customers.address',
        'customers.apartment',
        'customers.locationId',
        'customers.dateOfBirth',
        'customers.isActive',
        'customers.totalPoints',
        'customers.lifetimePoints',
        'customers.notes',
        'customers.uuid',
        'customers.createdAt',
        'customers.updatedAt',
        'customers.createdVia',
        'customers.tierId',
        'customers.pinEnabled',
        'customers.pinHash',
        'customers.pinSetAt',
        // Add tier fields with aliases
        'customerTiers.name as tierName',
        'customerTiers.color as tierColor',
        'customerTiers.icon as tierIcon',
        'customerTiers.minLifetimePoints as tierMinPoints',
        'customerTiers.pointsMultiplier as tierMultiplier',
        'customerTiers.discountPercentage as tierDiscount',
      ]);

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      query = query.where((eb) => eb.or([
        eb('customers.firstName', 'ilike', searchTerm),
        eb('customers.lastName', 'ilike', searchTerm),
        eb('customers.mobile', 'ilike', searchTerm),
        eb('customers.idNumber', 'ilike', searchTerm),
      ]));
    }

    if (input.isActive !== undefined) {
      query = query.where('customers.isActive', '=', input.isActive);
    }

    const customers = await query
      .orderBy('customers.firstName', 'asc')
      .orderBy('customers.lastName', 'asc')
      .execute();

    return new Response(superjson.stringify(customers satisfies OutputType));
  } catch (error) {
    console.error("Error fetching customers:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch customers: ${errorMessage}` }), { status: 500 });
  }
}