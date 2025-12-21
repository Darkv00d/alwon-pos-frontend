import { db } from "./db";
import { Selectable, Transaction } from "kysely";
import { ProductLots, DB } from "./schema";

type LotWithBalance = Selectable<ProductLots> & {
  balance: number;
};

/**
 * Calculates the total stock for a given product by summing all its stock movements.
 * This function is intended for server-side use only as it directly queries the database.
 * @param productUuid The UUID of the product.
 * @returns A promise that resolves to the total stock quantity as a number.
 */
export async function getProductStock(productUuid: string, trx?: Transaction<DB>): Promise<number> {
  console.log(`Calculating stock for product: ${productUuid}`);
  try {
    const executor = trx ?? db;
    const result = await executor
      .selectFrom("stockMovements")
      .select((eb) => eb.fn.sum<number>('qty').as('totalStock'))
      .where("productUuid", "=", productUuid)
      .executeTakeFirst();

    const totalStock = Number(result?.totalStock ?? 0);
    console.log(`Total stock for product ${productUuid} is ${totalStock}`);
    return totalStock;
  } catch (error) {
    console.error(`Error getting product stock for ${productUuid}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get stock for product ${productUuid}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while getting stock for product ${productUuid}`);
  }
}

/**
 * Retrieves all lots for a given product that have a positive stock balance,
 * ordered by their expiration date (FEFO - First Expired, First Out).
 * Lots without an expiration date are considered last.
 * This function is intended for server-side use only.
 * @param productUuid The UUID of the product.
 * @returns A promise that resolves to an array of lots with their balances.
 */
export async function getLotsWithBalance(
  productUuid: string,
  trx?: Transaction<DB>
): Promise<LotWithBalance[]> {
  console.log(`Fetching lots with balance for product: ${productUuid}`);
  try {
    const executor = trx ?? db;
    const lotsWithBalance = await executor
      .selectFrom("productLots")
      .innerJoin("stockMovements", "productLots.id", "stockMovements.lotId")
      .select([
        "productLots.id",
        "productLots.lotCode",
        "productLots.productUuid",
        "productLots.expiresOn",
        (eb) => eb.fn.sum<number>('stockMovements.qty').as('balance'),
      ])
      .where("productLots.productUuid", "=", productUuid)
      .groupBy("productLots.id")
      .having((eb) => eb.fn.sum<number>('stockMovements.qty'), ">", 0)
      .orderBy("productLots.expiresOn", "asc") // FEFO: oldest expiration first
      .execute();
    
    console.log(`Found ${lotsWithBalance.length} lots with positive balance for product ${productUuid}`);
    return lotsWithBalance;
  } catch (error) {
    console.error(`Error getting lots with balance for ${productUuid}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get lots for product ${productUuid}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while getting lots for product ${productUuid}`);
  }
}

export type Allocation = {
  lotId: string;
  quantity: number;
};

/**
 * Allocates a requested quantity of a product from available lots using FEFO logic.
 * It checks for sufficient total stock before attempting allocation.
 * This function is intended for server-side use only.
 * @param productUuid The UUID of the product to allocate.
 * @param requestedQty The quantity requested.
 * @returns A promise that resolves to an array of allocations specifying which lots to consume from.
 * @throws An error if there is insufficient stock.
 */
export async function allocateFEFO(
  productUuid: string,
  requestedQty: number,
  trx?: Transaction<DB>
): Promise<Allocation[]> {
  console.log(`Allocating ${requestedQty} of product ${productUuid} using FEFO.`);
  
  if (requestedQty <= 0) {
    throw new Error("Requested quantity must be greater than zero.");
  }

  const totalStock = await getProductStock(productUuid, trx);

  if (totalStock < requestedQty) {
    console.error(`Insufficient stock for product ${productUuid}. Requested: ${requestedQty}, Available: ${totalStock}`);
    throw new Error(
      `Insufficient stock for product ${productUuid}. Requested: ${requestedQty}, Available: ${totalStock}`
    );
  }

  const availableLots = await getLotsWithBalance(productUuid, trx);

  const allocations: Allocation[] = [];
  let remainingQty = requestedQty;

  for (const lot of availableLots) {
    if (remainingQty <= 0) break;

    const qtyFromThisLot = Math.min(remainingQty, lot.balance);

    allocations.push({
      lotId: lot.id,
      quantity: qtyFromThisLot,
    });

    remainingQty -= qtyFromThisLot;
  }

  if (remainingQty > 0) {
    // This case should theoretically not be reached if getProductStock is accurate,
    // but it's a good safeguard against race conditions or data inconsistencies.
    console.error(`Stock discrepancy for product ${productUuid}. Could not allocate ${remainingQty} units.`);
    throw new Error(
      `Stock allocation failed due to a discrepancy. Please try again.`
    );
  }
  
  console.log(`Successfully created allocation plan for product ${productUuid}`, allocations);
  return allocations;
}