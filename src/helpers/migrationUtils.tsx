import { db } from "./db";
import { type Kysely, sql } from "kysely";
import { type DB } from "./schema";

/**
 * A collection of utility functions to assist with complex data migrations
 * that cannot be handled by simple schema changes. These are typically one-off
 * scripts run during a deployment.
 *
 * Each migration function should be idempotent and include clear logging.
 *
 * Usage:
 * Create a new async function for each data migration task. These can be
 * executed from a secure, internal endpoint after a deployment.
 */

type MigrationResult = {
  migrationName: string;
  success: boolean;
  message: string;
  details?: {
    rowsAffected?: number | bigint;
    [key: string]: unknown;
  };
};

/**
 * Example Migration: Populates the `products.stockQuantity` field by summing up
 * all existing `stockMovements` for each product. This is a one-time backfill operation.
 *
 * Idempotency: This operation is safe to re-run, as it will always recalculate
 * the sum and update the field with the correct current value.
 */
export async function migrateStockQuantities(): Promise<MigrationResult> {
  const migrationName = "Backfill Product Stock Quantities";
  console.log(`Running migration: ${migrationName}`);

  try {
    // This query calculates the sum of movements for each product and updates
    // the `stockQuantity` field in the `products` table accordingly.
    const result = await db
      .with('stock_sums', (eb) => eb
        .selectFrom('stockMovements')
        .select(['productId', sql<number>`sum(qty)`.as('total_stock')])
        .groupBy('productId')
      )
      .updateTable('products')
      .set((eb) => ({
        stockQuantity: eb
          .selectFrom('stock_sums')
          .select('total_stock')
          .whereRef('stock_sums.productId', '=', 'products.id')
      }))
      .where(
        (eb) => eb.exists(
          eb.selectFrom('stock_sums').whereRef('stock_sums.productId', '=', 'products.id')
        )
      )
      .executeTakeFirst();

    const rowsAffected = result.numUpdatedRows;
    const message = `Successfully updated stock quantities for ${rowsAffected} products.`;
    console.log(message);

    return {
      migrationName,
      success: true,
      message,
      details: { rowsAffected },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Migration '${migrationName}' failed:`, error);
    return { migrationName, success: false, message };
  }
}

/**
 * Example Migration: Sets a default `locationId` for all existing purchase orders
 * that have a NULL value. This might be needed after making the field required.
 *
 * Idempotency: This only affects rows where `locationId` is NULL, so it's safe to re-run.
 */
export async function migrateDefaultLocationForPOs(): Promise<MigrationResult> {
  const migrationName = "Set Default Location for Purchase Orders";
  console.log(`Running migration: ${migrationName}`);

  try {
    // First, find a default location to use. We'll pick the first "bodega".
    const defaultLocation = await db
      .selectFrom("locations")
      .select("id")
      .where("locationType", "=", "bodega")
      .orderBy("createdAt", "asc")
      .limit(1)
      .executeTakeFirst();

    if (!defaultLocation) {
      const message = "No default 'bodega' location found. Cannot run migration.";
      console.error(message);
      return { migrationName, success: false, message };
    }

    const result = await db
      .updateTable("purchaseOrders")
      .set({ locationId: defaultLocation.id })
      .where("locationId", "is", null)
      .executeTakeFirst();

    const rowsAffected = result.numUpdatedRows;
    const message = `Successfully set default location for ${rowsAffected} purchase orders.`;
    console.log(message);

    return {
      migrationName,
      success: true,
      message,
      details: { rowsAffected, defaultLocationId: defaultLocation.id },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Migration '${migrationName}' failed:`, error);
    return { migrationName, success: false, message };
  }
}