import { ExpressionBuilder, SelectQueryBuilder } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { DB } from "./schema";

/**
 * Represents the selected fields from the 'vehicles' table.
 * This type is used to ensure type safety when nesting vehicle data in route queries.
 */
export type VehicleSelection = {
  id: number;
  name: string | null;
  capacity: number | null;
};

/**
 * A Kysely helper that enriches a query with a nested 'vehicle' object.
 *
 * This function uses `jsonObjectFrom` to perform a subquery on the 'vehicles' table,
 * joining it based on the 'vehicleId' of the primary table (e.g., 'routes').
 * It selects a specific subset of vehicle fields (`id`, `name`, `capacity`) and
 * nests them under a 'vehicle' key in the result set.
 *
 * The explicit type casting `as 'vehicle'` with `VehicleSelection` is crucial
 * to solve a common Kysely TypeScript issue where the inferred type of the
 * JSON object would otherwise be a generic `{}`, leading to type errors.
 *
 * @example
 * // Usage within a Kysely query chain:
 * const routesWithVehicles = await db
 *   .selectFrom('routes')
 *   .selectAll('routes')
 *   .select((eb) => [withVehicle(eb)]) // Adds the nested vehicle object
 *   .execute();
 *
 * // The resulting type will be:
 * // Array<Selectable<Routes> & { vehicle: VehicleSelection | null }>
 *
 * @param eb - The Kysely ExpressionBuilder for the query, typed for the 'routes' table.
 * @returns A Kysely expression that resolves to a nested vehicle object or null.
 */
export const withVehicle = (eb: ExpressionBuilder<DB, "routes">) => {
  return jsonObjectFrom(
    eb
      .selectFrom("vehicles")
      .whereRef("vehicles.id", "=", "routes.vehicleId")
      .select(["vehicles.id", "vehicles.name", "vehicles.capacity"])
  ).as("vehicle");
};