import superjson from 'superjson';
import { db } from '../../../helpers/db';

function sod(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function eod(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function handle(req: Request) {
  const now = new Date();
  const s = sod(now), e = eod(now);
  const ids = (req.headers.get('x-location-ids') || '').split(',').map(s => s.trim()).filter(Boolean).map(Number);
  let q = db.selectFrom('timeClocks').selectAll().where('clockInAt', '>=', s).where('clockInAt', '<=', e);
  if (ids.length) q = q.where('locationId', 'in', ids as any);
  const rows = await q.orderBy('clockInAt', 'desc').execute();
  return new Response(superjson.stringify({ ok: true, punches: rows }));
}