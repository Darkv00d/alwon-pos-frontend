import { db } from "./db";
import { type Kysely, type Compilable, sql } from "kysely";
import { type DB } from "./schema";

/**
 * A collection of utility functions to help diagnose and analyze database performance.
 * These tools are intended for developers to debug slow queries and optimize database interactions.
 *
 * Usage:
 * These functions can be used within endpoints or scripts during development to
 * analyze the performance of specific database operations.
 */

/**
 * Measures and logs the execution time of any async function.
 * @param description A description of the operation being timed.
 * @param fn The async function to execute and measure.
 * @returns The result of the executed function.
 */
export async function measureExecutionTime<T>(
  description: string,
  fn: () => Promise<T>
): Promise<T> {
  console.log(`[Performance] Starting: ${description}`);
  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`[Performance] Finished: ${description}. Duration: ${duration}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.error(`[Performance] Failed: ${description} after ${duration}ms.`, error);
    throw error;
  }
}

/**
 * Executes a Kysely query with `EXPLAIN ANALYZE` to get the database's query plan.
 * This is extremely useful for understanding why a query is slow.
 *
 * @param query A compilable Kysely query object.
 * @returns The raw output from `EXPLAIN ANALYZE`.
 */
export async function getQueryPlan<T>(
  query: Compilable<T>
): Promise<Array<{ "QUERY PLAN": string }>> {
  const { sql: compiledSql, parameters } = query.compile();

  try {
    // Use sql template for raw EXPLAIN ANALYZE query
    const result = await sql`EXPLAIN (ANALYZE, BUFFERS) ${sql.raw(compiledSql)}`.execute(db);
    
    return result.rows as Array<{ "QUERY PLAN": string }>;
  } catch (error) {
    console.error("Failed to get query plan:", error);
    throw new Error("Could not execute EXPLAIN ANALYZE on the provided query.");
  }
}

/**
 * A practical example of how to use the performance utils.
 */
export async function runPerformanceExamples() {
  console.log("--- Running Performance Util Examples ---");

  // Example 1: Measuring a simple query
  await measureExecutionTime("Fetch first 10 products", async () => {
    return await db.selectFrom("products").selectAll().limit(10).execute();
  });

  // Example 2: Getting a query plan
  console.log("\n--- Analyzing a more complex query ---");
  const complexQuery = db
    .selectFrom("products")
    .innerJoin("categories", "categories.id", "products.categoryId")
    .innerJoin("suppliers", "suppliers.id", "products.supplierId")
    .select([
      "products.name as productName",
      "categories.name as categoryName",
      "suppliers.name as supplierName",
    ])
    .where("products.price", ">", "3000")
    .limit(50);

  try {
    const plan = await getQueryPlan(complexQuery);
    console.log("Query Plan:");
    // The plan is an array of objects, each with a "QUERY PLAN" key.
    // We join the lines for readability.
    console.log(plan.map(p => p['QUERY PLAN']).join('\n'));
  } catch (error) {
    console.error("Could not get query plan for example query.", error);
  }

  console.log("\n--- Performance Util Examples Complete ---");
}