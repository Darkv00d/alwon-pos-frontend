import { db } from "./db";
import { sql } from "kysely";

/**
 * A collection of utility functions to validate the integrity of data in the database.
 * These checks can help identify orphaned records, inconsistencies, or other data quality issues.
 *
 * Each function returns a standardized result object.
 *
 * Usage:
 * These functions can be called from a maintenance endpoint or script to periodically
 * check the health of the production database.
 */

type ValidationResult = {
  checkName: string;
  success: boolean;
  message: string;
  details?: unknown[];
};

/**
 * Checks for products with a `categoryId` that does not exist in the `categories` table.
 * @returns {Promise<ValidationResult>} The result of the validation check.
 */
export async function validateOrphanedProducts(): Promise<ValidationResult> {
  const checkName = "Orphaned Products Check";
  console.log(`Running: ${checkName}`);
  try {
    const orphanedProducts = await db
      .selectFrom("products")
      .leftJoin("categories", "categories.id", "products.categoryId")
      .where("products.categoryId", "is not", null)
      .where("categories.id", "is", null)
      .select(["products.id", "products.name", "products.categoryId"])
      .execute();

    if (orphanedProducts.length > 0) {
      return {
        checkName,
        success: false,
        message: `Found ${orphanedProducts.length} products with non-existent category IDs.`,
        details: orphanedProducts,
      };
    }

    return {
      checkName,
      success: true,
      message: "No orphaned products found.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`${checkName} failed:`, error);
    return { checkName, success: false, message };
  }
}

/**
 * Checks for purchase order items linked to a non-existent purchase order or product.
 * @returns {Promise<ValidationResult>} The result of the validation check.
 */
export async function validateOrphanedPurchaseOrderItems(): Promise<ValidationResult> {
  const checkName = "Orphaned Purchase Order Items Check";
  console.log(`Running: ${checkName}`);
  try {
    const orphanedItems = await db
      .selectFrom("purchaseOrderItems as poi")
      .leftJoin("purchaseOrders as po", "po.id", "poi.poId")
      .leftJoin("products as p", "p.id", "poi.productId")
      .where((eb) => eb.or([
        eb("po.id", "is", null),
        eb("p.id", "is", null)
      ]))
      .select(["poi.id", "poi.poId", "poi.productId"])
      .execute();

    if (orphanedItems.length > 0) {
      return {
        checkName,
        success: false,
        message: `Found ${orphanedItems.length} PO items linked to missing POs or products.`,
        details: orphanedItems,
      };
    }

    return {
      checkName,
      success: true,
      message: "No orphaned purchase order items found.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`${checkName} failed:`, error);
    return { checkName, success: false, message };
  }
}

/**
 * Checks if the `stockQuantity` on the `products` table matches the calculated
 * sum of all its `stockMovements`. This is a heavy check and should be used sparingly.
 * @returns {Promise<ValidationResult>} The result of the validation check.
 */
export async function validateStockConsistency(): Promise<ValidationResult> {
  const checkName = "Stock Consistency Check";
  console.log(`Running: ${checkName}`);
  try {
    const inconsistentProducts = await db
      .selectFrom("products as p")
      .select([
        "p.id",
        "p.name",
        "p.stockQuantity",
        (eb) => eb.selectFrom("stockMovements as sm")
          .whereRef("sm.productId", "=", "p.id")
          .select(sql<number>`coalesce(sum(${sql.ref("sm.qty")}), 0)`.as("calculatedStock"))
          .as("calculatedStock")
      ])
      .having(
        sql`coalesce(${sql.ref("p.stockQuantity")}, 0) != coalesce(${sql.ref("calculatedStock")}, 0)`
      )
      .execute();

    if (inconsistentProducts.length > 0) {
      return {
        checkName,
        success: false,
        message: `Found ${inconsistentProducts.length} products with inconsistent stock counts.`,
        details: inconsistentProducts.map(p => ({
          ...p,
          stockQuantity: Number(p.stockQuantity),
          calculatedStock: Number(p.calculatedStock)
        })),
      };
    }

    return {
      checkName,
      success: true,
      message: "All product stock quantities are consistent with their movement history.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`${checkName} failed:`, error);
    return { checkName, success: false, message };
  }
}


/**
 * Runs all available data validation checks and returns a summary report.
 * @returns {Promise<ValidationResult[]>} An array of results from all checks.
 */
export async function runAllValidations(): Promise<ValidationResult[]> {
  console.log("--- Starting All Data Validations ---");
  const results = await Promise.all([
    validateOrphanedProducts(),
    validateOrphanedPurchaseOrderItems(),
    validateStockConsistency(),
  ]);
  console.log("--- Data Validation Run Complete ---");
  return results;
}