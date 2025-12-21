import { db } from '../helpers/db';
import { OutputType } from "./pos-locations_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    // Check for location filtering header
    const locationIds = request.headers.get('X-Location-Ids');
    const locationIdsArray = locationIds ? locationIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];

    // Build query to get POS equipment with location information
    let query = db
      .selectFrom('posEquipment')
      .innerJoin('locations', 'posEquipment.locationId', 'locations.id')
      .select([
        'posEquipment.id',
        'posEquipment.name',
        'posEquipment.code',
        'posEquipment.isActive',
        'posEquipment.locationId',
        'locations.name as locationName',
        'locations.locationType as locationType',
        'locations.address as address'
      ])
      .where('posEquipment.isActive', '=', true)
      .where('locations.isActive', '=', true);

    // Apply location filtering if provided
    if (locationIdsArray.length > 0) {
      query = query.where('posEquipment.locationId', 'in', locationIdsArray);
    }

    const locations = await query
      .orderBy('posEquipment.name', 'asc')
      .execute();

    return new Response(superjson.stringify({ ok: true, locations } satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching active POS equipment:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // Note: This is a public endpoint, so the error format doesn't need to conform to OutputType
    return new Response(superjson.stringify({ error: `Failed to fetch POS locations: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}