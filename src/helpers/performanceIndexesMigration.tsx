import { db } from "./db";

/**
 * =================================================================
 * STOCK MOVEMENTS & PRODUCT LOTS INDEXES
 * =================================================================
 * Purpose: These indexes are critical for First-Expired, First-Out (FEFO)
 * inventory logic and general stock querying performance. They speed up
 * lookups for product stock levels, expiration dates, and movement history.
 * Impact: Significantly improves performance of inventory management pages,
 * POS transaction validation (checking stock), and automated reordering logic.
 */

/**
 * Speeds up queries that find lots for a specific product, ordered by expiration date.
 * This is the cornerstone of FEFO logic.
 */
export const IDX_PRODUCT_LOTS_PRODUCT_EXPIRATION = {
  name: "idx_product_lots_product_expiration",
  query: () => db.schema
    .createIndex("idx_product_lots_product_expiration")
    .on("product_lots")
    .columns(["product_uuid", "expires_on"])
    .ifNotExists()
};

/**
 * Optimizes queries filtering stock movements by product and location, which is
 * a very common operation for checking current stock or historical data.
 */
export const IDX_STOCK_MOVEMENTS_PRODUCT_LOCATION = {
  name: "idx_stock_movements_product_location",
  query: () => db.schema
    .createIndex("idx_stock_movements_product_location")
    .on("stock_movements")
    .columns(["product_uuid", "location_id"])
    .ifNotExists()
};

/**
 * Improves performance when joining stock_movements with product_lots to get
 * expiration data for specific movement records.
 */
export const IDX_STOCK_MOVEMENTS_LOT_ID = {
  name: "idx_stock_movements_lot_id",
  query: () => db.schema
    .createIndex("idx_stock_movements_lot_id")
    .on("stock_movements")
    .columns(["lot_id"])
    .ifNotExists()
};

/**
 * =================================================================
 * TRANSACTIONS & PAYMENTS INDEXES
 * =================================================================
 * Purpose: To accelerate reporting, sales analysis, and payment lookups.
 * Impact: Faster loading times for sales dashboards, financial reports,
 * and retrieving transaction details.
 */

/**
 * Speeds up reporting queries that aggregate sales data by location over a
 * specific time period. Ordering by created_at DESC is common for "latest sales" reports.
 */
export const IDX_TRANSACTIONS_LOCATION_CREATED_AT = {
  name: "idx_transactions_location_created_at",
  query: () => db.schema
    .createIndex("idx_transactions_location_created_at")
    .on("transactions")
    .columns(["location_id", "created_at"])
    .ifNotExists()
};

/**
 * Essential for quickly retrieving all items belonging to a specific transaction.
 */
export const IDX_TRANSACTION_ITEMS_TRANSACTION_ID = {
  name: "idx_transaction_items_transaction_id",
  query: () => db.schema
    .createIndex("idx_transaction_items_transaction_id")
    .on("transaction_items")
    .columns(["transaction_id"])
    .ifNotExists()
};

/**
 * Optimizes queries that analyze sales of a specific product across all transactions.
 */
export const IDX_TRANSACTION_ITEMS_PRODUCT_ID = {
  name: "idx_transaction_items_product_id",
  query: () => db.schema
    .createIndex("idx_transaction_items_product_id")
    .on("transaction_items")
    .columns(["product_id"])
    .ifNotExists()
};

/**
 * Improves performance when looking up payment details for a given transaction.
 */
export const IDX_PAYMENTS_TRANSACTION_ID = {
  name: "idx_payments_transaction_id",
  query: () => db.schema
    .createIndex("idx_payments_transaction_id")
    .on("payments")
    .columns(["transaction_id"])
    .ifNotExists()
};

/**
 * =================================================================
 * AUTHENTICATION & SECURITY INDEXES
 * =================================================================
 * Purpose: To enhance the performance and security of the authentication system.
 * Impact: Faster session validation, quicker user lookups during login, and
 * more efficient monitoring of login attempt patterns.
 */

/**
 * Critical for quickly validating a user's session token. This query runs on
 * almost every authenticated API request.
 */
export const IDX_SESSIONS_ID = {
  name: "idx_sessions_id",
  query: () => db.schema
    .createIndex("idx_sessions_id")
    .on("sessions")
    .columns(["id"])
    .unique()
    .ifNotExists()
};

/**
 * Speeds up lookups for all active sessions belonging to a specific user.
 */
export const IDX_SESSIONS_USER_UUID = {
  name: "idx_sessions_user_uuid",
  query: () => db.schema
    .createIndex("idx_sessions_user_uuid")
    .on("sessions")
    .columns(["user_uuid"])
    .ifNotExists()
};

/**
 * Optimizes queries that check for failed login attempts from a specific email
 * address, which is important for security features like rate limiting.
 */
export const IDX_LOGIN_ATTEMPTS_EMAIL_ATTEMPTED_AT = {
  name: "idx_login_attempts_email_attempted_at",
  query: () => db.schema
    .createIndex("idx_login_attempts_email_attempted_at")
    .on("login_attempts")
    .columns(["email", "attempted_at"])
    .ifNotExists()
};

/**
 * =================================================================
 * PRODUCTS INDEXES (Part 2)
 * =================================================================
 * Purpose: To optimize product lookups, category filtering, and barcode searches.
 * Impact: Faster product search, category browsing, and POS barcode scanning.
 */

/**
 * Essential for quick product lookups by UUID, which is used throughout the application.
 */
export const IDX_PRODUCTS_UUID = {
  name: "idx_products_uuid",
  query: () => db.schema
    .createIndex("idx_products_uuid")
    .on("products")
    .columns(["uuid"])
    .ifNotExists()
};

/**
 * Speeds up category-based product filtering, commonly used in inventory management
 * and product browsing interfaces.
 */
export const IDX_PRODUCTS_CATEGORY_ID = {
  name: "idx_products_category_id",
  query: () => db.schema
    .createIndex("idx_products_category_id")
    .on("products")
    .columns(["category_id"])
    .ifNotExists()
};

/**
 * Optimizes queries that filter products by active status, which is fundamental
 * for displaying only available products in the POS system.
 */
export const IDX_PRODUCTS_IS_ACTIVE = {
  name: "idx_products_is_active",
  query: () => db.schema
    .createIndex("idx_products_is_active")
    .on("products")
    .columns(["is_active"])
    .ifNotExists()
};

/**
 * Critical for barcode scanning operations. Uses partial index to only index
 * products that actually have barcodes, improving efficiency.
 */
export const IDX_PRODUCTS_BARCODE = {
  name: "idx_products_barcode",
  query: () => db.schema
    .createIndex("idx_products_barcode")
    .on("products")
    .columns(["barcode"])
    .where("barcode", "is not", null)
    .ifNotExists()
};

/**
 * =================================================================
 * CUSTOMERS INDEXES (Part 2)
 * =================================================================
 * Purpose: To optimize customer lookups, search operations, and loyalty program queries.
 * Impact: Faster customer identification, search performance, and points management.
 */

/**
 * Essential for customer lookups by UUID, used throughout customer management features.
 */
export const IDX_CUSTOMERS_UUID = {
  name: "idx_customers_uuid",
  query: () => db.schema
    .createIndex("idx_customers_uuid")
    .on("customers")
    .columns(["uuid"])
    .ifNotExists()
};

/**
 * Optimizes customer number lookups, which is a common search method in POS systems.
 */
export const IDX_CUSTOMERS_CUSTOMER_NUMBER = {
  name: "idx_customers_customer_number",
  query: () => db.schema
    .createIndex("idx_customers_customer_number")
    .on("customers")
    .columns(["customer_number"])
    .ifNotExists()
};

/**
 * Speeds up email-based customer searches. Uses partial index to only index
 * customers that have email addresses.
 */
export const IDX_CUSTOMERS_EMAIL = {
  name: "idx_customers_email",
  query: () => db.schema
    .createIndex("idx_customers_email")
    .on("customers")
    .columns(["email"])
    .where("email", "is not", null)
    .ifNotExists()
};

/**
 * =================================================================
 * POINTS TRANSACTIONS INDEXES (Part 2)
 * =================================================================
 * Purpose: To optimize loyalty program queries and points history reporting.
 * Impact: Faster points balance calculations, transaction history, and loyalty reports.
 */

/**
 * Critical for retrieving all points transactions for a specific customer,
 * which is needed for points balance calculations and transaction history.
 */
export const IDX_POINTS_TRANSACTIONS_CUSTOMER_ID = {
  name: "idx_points_transactions_customer_id",
  query: () => db.schema
    .createIndex("idx_points_transactions_customer_id")
    .on("points_transactions")
    .columns(["customer_id"])
    .ifNotExists()
};

/**
 * Optimizes temporal reports and queries that analyze points transactions over time.
 */
export const IDX_POINTS_TRANSACTIONS_CREATED_AT = {
  name: "idx_points_transactions_created_at",
  query: () => db.schema
    .createIndex("idx_points_transactions_created_at")
    .on("points_transactions")
    .columns(["created_at"])
    .ifNotExists()
};

/**
 * =================================================================
 * PERMISSIONS INDEXES (Part 2)
 * =================================================================
 * Purpose: To optimize role-based access control queries and permission checks.
 * Impact: Faster authentication, role verification, and permissions management.
 */

/**
 * Essential for quickly retrieving user roles by user UUID, which is critical
 * for permission checks throughout the application.
 */
export const IDX_USER_ROLE_USER_UUID = {
  name: "idx_user_role_user_uuid",
  query: () => db.schema
    .createIndex("idx_user_role_user_uuid")
    .on("user_role")
    .columns(["user_uuid"])
    .ifNotExists()
};

/**
 * Optimizes queries that retrieve module permissions for a specific role,
 * which is used in role management and permission validation.
 */
export const IDX_ROLE_MODULE_ROLE_ID = {
  name: "idx_role_module_role_id",
  query: () => db.schema
    .createIndex("idx_role_module_role_id")
    .on("role_module")
    .columns(["role_id"])
    .ifNotExists()
};

/**
 * An array containing all performance index creation queries.
 * This allows for easy iteration and execution.
 */
export const ALL_PERFORMANCE_INDEXES = [
  // Stock & Lots
  IDX_PRODUCT_LOTS_PRODUCT_EXPIRATION,
  IDX_STOCK_MOVEMENTS_PRODUCT_LOCATION,
  IDX_STOCK_MOVEMENTS_LOT_ID,
  // Transactions & Payments
  IDX_TRANSACTIONS_LOCATION_CREATED_AT,
  IDX_TRANSACTION_ITEMS_TRANSACTION_ID,
  IDX_TRANSACTION_ITEMS_PRODUCT_ID,
  IDX_PAYMENTS_TRANSACTION_ID,
  // Auth & Security
  IDX_SESSIONS_ID,
  IDX_SESSIONS_USER_UUID,
  IDX_LOGIN_ATTEMPTS_EMAIL_ATTEMPTED_AT,
  // Products (Part 2)
  IDX_PRODUCTS_UUID,
  IDX_PRODUCTS_CATEGORY_ID,
  IDX_PRODUCTS_IS_ACTIVE,
  IDX_PRODUCTS_BARCODE,
  // Customers (Part 2)
  IDX_CUSTOMERS_UUID,
  IDX_CUSTOMERS_CUSTOMER_NUMBER,
  IDX_CUSTOMERS_EMAIL,
  // Points Transactions (Part 2)
  IDX_POINTS_TRANSACTIONS_CUSTOMER_ID,
  IDX_POINTS_TRANSACTIONS_CREATED_AT,
  // Permissions (Part 2)
  IDX_USER_ROLE_USER_UUID,
  IDX_ROLE_MODULE_ROLE_ID,
];

/**
 * =================================================================
 * ROLLBACK STATEMENTS
 * =================================================================
 * Purpose: To provide a safe way to remove all performance indexes.
 * Usage: Use during development, testing, or when indexes need to be recreated.
 */

/**
 * Array containing all DROP INDEX statements for rollback purposes.
 * Each statement includes IF EXISTS clause to make rollback safe to re-run.
 */
export const ALL_ROLLBACK_STATEMENTS = [
  // Stock & Lots
  "DROP INDEX IF EXISTS idx_product_lots_product_expiration",
  "DROP INDEX IF EXISTS idx_stock_movements_product_location",
  "DROP INDEX IF EXISTS idx_stock_movements_lot_id",
  // Transactions & Payments
  "DROP INDEX IF EXISTS idx_transactions_location_created_at",
  "DROP INDEX IF EXISTS idx_transaction_items_transaction_id",
  "DROP INDEX IF EXISTS idx_transaction_items_product_id",
  "DROP INDEX IF EXISTS idx_payments_transaction_id",
  // Auth & Security
  "DROP INDEX IF EXISTS idx_sessions_id",
  "DROP INDEX IF EXISTS idx_sessions_user_uuid",
  "DROP INDEX IF EXISTS idx_login_attempts_email_attempted_at",
  // Products (Part 2)
  "DROP INDEX IF EXISTS idx_products_uuid",
  "DROP INDEX IF EXISTS idx_products_category_id",
  "DROP INDEX IF EXISTS idx_products_is_active",
  "DROP INDEX IF EXISTS idx_products_barcode",
  // Customers (Part 2)
  "DROP INDEX IF EXISTS idx_customers_uuid",
  "DROP INDEX IF EXISTS idx_customers_customer_number",
  "DROP INDEX IF EXISTS idx_customers_email",
  // Points Transactions (Part 2)
  "DROP INDEX IF EXISTS idx_points_transactions_customer_id",
  "DROP INDEX IF EXISTS idx_points_transactions_created_at",
  // Permissions (Part 2)
  "DROP INDEX IF EXISTS idx_user_role_user_uuid",
  "DROP INDEX IF EXISTS idx_role_module_role_id",
];

/**
 * =================================================================
 * MAIN FUNCTIONS
 * =================================================================
 */

/**
 * Executes all defined performance index creation queries against the database.
 * This function is idempotent, meaning it can be run multiple times without
 * causing errors, thanks to the "ifNotExists()" clause in each query.
 *
 * Usage:
 * ```typescript
 * import { applyPerformanceIndexes } from './helpers/performanceIndexesMigration';
 * 
 * // Apply all performance indexes
 * await applyPerformanceIndexes();
 * ```
 *
 * This should be run as part of a database migration or setup script.
 */
export const applyPerformanceIndexes = async (): Promise<void> => {
  console.log("Starting to apply performance indexes...");

  for (const indexDefinition of ALL_PERFORMANCE_INDEXES) {
    try {
      console.log(`Applying index: ${indexDefinition.name}...`);
      await indexDefinition.query().execute();
      console.log(`Successfully applied or verified index: ${indexDefinition.name}`);
    } catch (error) {
      console.error(
        `Failed to apply index: ${indexDefinition.name}`,
        error
      );
      // Depending on the strategy, you might want to re-throw the error
      // to stop a migration script. For this helper, we'll just log it.
      if (error instanceof Error) {
        throw new Error(`Failed to apply index ${indexDefinition.name}: ${error.message}`);
      } else {
        throw new Error(`An unknown error occurred while applying index: ${indexDefinition.name}`);
      }
    }
  }

  console.log("All performance indexes have been successfully applied.");
};

/**
 * Removes all performance indexes from the database.
 * This function is idempotent and safe to re-run thanks to the "ifExists()" clause.
 *
 * Usage:
 * ```typescript
 * import { rollbackPerformanceIndexes } from './helpers/performanceIndexesMigration';
 * 
 * // Remove all performance indexes
 * await rollbackPerformanceIndexes();
 * ```
 *
 * Warning: This will remove ALL performance indexes defined in this migration.
 * Use with caution in production environments as it may impact query performance.
 * 
 * Common use cases:
 * - Development/testing environments where you need to reset indexes
 * - Before recreating indexes with different configurations
 * - Troubleshooting index-related database issues
 */
export const rollbackPerformanceIndexes = async (): Promise<void> => {
  console.log("Starting to rollback performance indexes...");

  // Extract index names from ALL_PERFORMANCE_INDEXES for consistent rollback
  const indexNames = ALL_PERFORMANCE_INDEXES.map(idx => idx.name);

  for (const indexName of indexNames) {
    try {
      console.log(`Dropping index: ${indexName}...`);
      await db.schema.dropIndex(indexName).ifExists().execute();
      console.log(`Successfully dropped index: ${indexName}`);
    } catch (error) {
      console.error(
        `Failed to drop index: ${indexName}`,
        error
      );
      if (error instanceof Error) {
        throw new Error(`Failed to drop index ${indexName}: ${error.message}`);
      } else {
        throw new Error(`An unknown error occurred while dropping index: ${indexName}`);
      }
    }
  }

  console.log("All performance indexes have been successfully rolled back.");
};

/**
 * =================================================================
 * USAGE EXAMPLES
 * =================================================================
 * 
 * 1. Apply all indexes (typical migration scenario):
 * ```typescript
 * import { applyPerformanceIndexes } from './helpers/performanceIndexesMigration';
 * 
 * try {
 *   await applyPerformanceIndexes();
 *   console.log('Database indexes are ready!');
 * } catch (error) {
 *   console.error('Failed to apply indexes:', error);
 * }
 * ```
 * 
 * 2. Rollback all indexes (development/troubleshooting):
 * ```typescript
 * import { rollbackPerformanceIndexes } from './helpers/performanceIndexesMigration';
 * 
 * try {
 *   await rollbackPerformanceIndexes();
 *   console.log('All indexes have been removed');
 * } catch (error) {
 *   console.error('Failed to rollback indexes:', error);
 * }
 * ```
 * 
 * 3. Complete reset and reapply (for index modifications):
 * ```typescript
 * import { 
 *   rollbackPerformanceIndexes, 
 *   applyPerformanceIndexes 
 * } from './helpers/performanceIndexesMigration';
 * 
 * try {
 *   await rollbackPerformanceIndexes();
 *   await applyPerformanceIndexes();
 *   console.log('Indexes have been reset and reapplied');
 * } catch (error) {
 *   console.error('Failed to reset indexes:', error);
 * }
 * ```
 */