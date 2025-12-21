import superjson from 'superjson';
import { withAuth } from '../../helpers/withAuth';
import { db } from '../../helpers/db';
import { OutputType } from './kiosks_GET.schema';
import { User } from '../../helpers/User';

async function handler(request: Request, user: User) {
  try {
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const kiosks = await db
      .selectFrom('kiosks')
      .innerJoin('locations', 'locations.id', 'kiosks.locationId')
      .select([
        'kiosks.id',
        'kiosks.locationId',
        'locations.name as locationName',
        'kiosks.deviceCode',
        'kiosks.deviceIdentifier',
        'kiosks.name',
        'kiosks.isActive',
        'kiosks.lastSeenAt',
        'kiosks.createdAt',
      ])
      .orderBy('kiosks.createdAt', 'desc')
      .execute();

    // The DB schema marks isActive as nullable, but the request requires a boolean.
    // We'll coalesce null to false to ensure type safety.
    const responseData: OutputType = kiosks.map(kiosk => ({
      ...kiosk,
      isActive: kiosk.isActive ?? false,
      // createdAt is not nullable in the DB, but let's be safe
      createdAt: kiosk.createdAt ?? new Date(0), 
    }));

    return new Response(superjson.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(superjson.stringify({ error: 'Failed to fetch kiosks', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const handle = withAuth(handler);