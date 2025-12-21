import { db } from '../helpers/db';
import { schema, OutputType, InputType } from "./pos-equipment_GET.schema";
import superjson from 'superjson';
import { ZodError } from 'zod';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Parse query parameters into correct types
    const parsedParams: Partial<InputType> = {};
    
    if (queryParams.isActive) {
      parsedParams.isActive = queryParams.isActive === 'true';
    }
    if (queryParams.locationId) {
      parsedParams.locationId = parseInt(queryParams.locationId, 10);
    }

    const validatedParams = schema.parse(parsedParams);

    const headerLocationIds = request.headers.get('X-Location-Ids');
    const locationIdsArray = headerLocationIds
      ? headerLocationIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : [];

    let query = db
      .selectFrom('posEquipment')
      .innerJoin('locations', 'posEquipment.locationId', 'locations.id')
      .select([
        'posEquipment.id',
        'posEquipment.name',
        'posEquipment.code',
        'posEquipment.description',
        'posEquipment.isActive',
        'posEquipment.createdAt',
        'posEquipment.updatedAt',
        'posEquipment.locationId',
        'locations.name as locationName',
        'locations.locationType as locationType',
        'locations.address as locationAddress'
      ]);

    if (validatedParams.locationId) {
      query = query.where('posEquipment.locationId', '=', validatedParams.locationId);
    }

    if (validatedParams.isActive !== undefined) {
      query = query.where('posEquipment.isActive', '=', validatedParams.isActive);
    }

    if (locationIdsArray.length > 0) {
      query = query.where('posEquipment.locationId', 'in', locationIdsArray);
    }

    const equipment = await query
      .orderBy('posEquipment.name', 'asc')
      .execute();

    return new Response(superjson.stringify({ equipment } satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching POS equipment:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid query parameters", details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch POS equipment: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}