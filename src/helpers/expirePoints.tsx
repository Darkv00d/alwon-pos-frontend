import { db } from "./db";
import { type Transaction } from "kysely";
import { type DB } from "./schema";

/**
 * Expires overdue customer points and creates corresponding adjustment transactions.
 * This function is designed to be called periodically, ideally on a daily basis.
 *
 * @returns An object containing statistics about the expiration process.
 */
export async function expirePoints() {
  console.log("Starting points expiration job...");

  try {
    const now = new Date();

    // Find all 'earned' points transactions that have expired.
    // We process all expired transactions and create adjustments for them.
    const expiredTransactions = await db
      .selectFrom("pointsTransactions")
      .select(["id", "customerId", "pointsAmount", "expiresAt"])
      .where("transactionType", "=", "earned")
      .where("expiresAt", "<=", now)
      .where("expiresAt", "is not", null)
      .execute();

    if (expiredTransactions.length === 0) {
      console.log("No new expired points found to process.");
      return { expired: 0, customers: 0, transactions: 0 };
    }

    // Group expired points by customer to process in batches.
    const customerExpiredPoints = new Map<
      number,
      { totalPoints: number; transactionIds: number[] }
    >();
    for (const tx of expiredTransactions) {
      const customerData = customerExpiredPoints.get(tx.customerId) || {
        totalPoints: 0,
        transactionIds: [],
      };
      customerData.totalPoints += tx.pointsAmount;
      customerData.transactionIds.push(tx.id);
      customerExpiredPoints.set(tx.customerId, customerData);
    }

    let totalExpired = 0;
    const processedCustomers = new Set<number>();

    // Process expirations for each customer within a database transaction.
    for (const [customerId, data] of customerExpiredPoints.entries()) {
      const { totalPoints, transactionIds } = data;
      if (totalPoints <= 0) continue;

      try {
        await db.transaction().execute(async (trx) => {
          // Create a single negative adjustment transaction for all expired points for this customer in this run.
          await trx
            .insertInto("pointsTransactions")
            .values({
              customerId,
              pointsAmount: -totalPoints,
              transactionType: "adjustment",
              description: `Puntos expirados automáticamente de ${transactionIds.length} transacciones.`,
              // Store original transaction IDs for auditing purposes
              referenceNumber: transactionIds.join(","),
              expiresAt: null, // Adjustments do not expire.
            })
            .execute();

          // Update the customer's total points. This does not affect lifetimePoints.
          await trx
            .updateTable("customers")
            .set((eb) => ({
              totalPoints: eb("totalPoints", "-", totalPoints),
            }))
            .where("id", "=", customerId)
            .execute();
        });

        totalExpired += totalPoints;
        processedCustomers.add(customerId);
      } catch (error) {
        console.error(
          `Failed to expire points for customer ${customerId}. Skipping.`,
          error
        );
      }
    }

    const result = {
      expired: totalExpired,
      customers: processedCustomers.size,
      transactions: expiredTransactions.length,
    };

    console.log(
      `Successfully expired ${result.expired} points for ${result.customers} customers from ${result.transactions} transactions.`
    );

    return result;
  } catch (error) {
    console.error("A critical error occurred during the points expiration job:", error);
    // Re-throw the error to be handled by the calling context (e.g., the API endpoint).
    throw error;
  }
}