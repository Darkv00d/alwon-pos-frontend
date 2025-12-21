import { type Transaction, sql } from "kysely";
import { type DB, type Products } from "./schema";
import { type Selectable } from "kysely";
import { nanoid } from "nanoid";

export type LowStockProduct = Selectable<Products> & {
  suggestedQuantity: number;
};

/**
 * Finds products where the current stock quantity is below the minimum stock level.
 * @param trx - Kysely transaction object.
 * @returns A promise that resolves to an array of low-stock products with a suggested reorder quantity.
 */
export async function findLowStockProducts(
  trx: Transaction<DB>
): Promise<LowStockProduct[]> {
  const products = await trx
    .selectFrom("products")
    .selectAll()
    .where(sql`stock_quantity < minimum_stock`)
    .where("supplierId", "is not", null)
    .execute();

  return products.map((p) => ({
    ...p,
    suggestedQuantity: p.minimumStock - p.stockQuantity,
  }));
}

/**
 * Groups a list of products by their supplier ID.
 * @param products - An array of products, typically low-stock products.
 * @returns An object where keys are supplier IDs and values are arrays of products belonging to that supplier.
 */
export function groupProductsBySupplier(
  products: LowStockProduct[]
): Record<number, LowStockProduct[]> {
  return products.reduce((acc, product) => {
    if (product.supplierId) {
      if (!acc[product.supplierId]) {
        acc[product.supplierId] = [];
      }
      acc[product.supplierId].push(product);
    }
    return acc;
  }, {} as Record<number, LowStockProduct[]>);
}

/**
 * Generates a unique purchase order number.
 * Format: PO-YYYYMMDD-ABCDE
 * @returns A promise that resolves to a unique PO number string.
 */
export async function generatePoNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const randomPart = nanoid(5).toUpperCase();
  return `PO-${year}${month}${day}-${randomPart}`;
}