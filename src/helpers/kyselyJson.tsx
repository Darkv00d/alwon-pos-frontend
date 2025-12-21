import { jsonObjectFrom } from 'kysely/helpers/postgres';
import type { SelectQueryBuilder, Expression } from 'kysely';

/**
 * Same as jsonObjectFrom but keeps the row-shape O so we don't lose
 * literal column types (avoids string | number widening etc.).
 */
export function kyselyJson<O>(
  qb: SelectQueryBuilder<any, any, O>
): Expression<O> {
  /* the cast is safe – we are only tightening the compile-time type */
  return jsonObjectFrom(qb) as Expression<O>;
}