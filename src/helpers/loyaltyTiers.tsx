import { db } from './db';
import { Selectable } from 'kysely';
import { CustomerTiers } from './schema';

/**
 * Represents a customer loyalty tier with its benefits and requirements.
 */
export type CustomerTier = {
  id: number;
  name:string;
  minLifetimePoints: number;
  pointsMultiplier: number;
  discountPercentage: number;
  color: string | null;
  icon: string | null;
};

// Type for the raw DB result which may have numeric fields as strings
type DbCustomerTier = Selectable<CustomerTiers>;

/**
 * Converts a raw database customer tier object to the application's CustomerTier type,
 * ensuring numeric fields are correctly typed as numbers.
 * @param dbTier - The customer tier object from the database.
 * @returns A CustomerTier object with correctly typed numeric fields.
 */
const toCustomerTier = (dbTier: DbCustomerTier): CustomerTier => ({
  ...dbTier,
  pointsMultiplier: Number(dbTier.pointsMultiplier),
  discountPercentage: Number(dbTier.discountPercentage),
});

/**
 * Calculates the appropriate loyalty tier for a customer based on their lifetime points.
 * It finds the highest tier for which the customer meets the minimum point requirement.
 * @param lifetimePoints - The total number of points a customer has earned over their lifetime.
 * @returns A promise that resolves to the calculated CustomerTier.
 * @throws Will throw an error if no matching tier is found (e.g., if the base tier is missing).
 */
export const calculateCustomerTier = async (lifetimePoints: number): Promise<CustomerTier> => {
  console.log(`Calculating tier for lifetimePoints: ${lifetimePoints}`);
  const dbTier = await db
    .selectFrom('customerTiers')
    .selectAll()
    .where('minLifetimePoints', '<=', lifetimePoints)
    .orderBy('minLifetimePoints', 'desc')
    .limit(1)
    .executeTakeFirstOrThrow();

  return toCustomerTier(dbTier);
};

/**
 * Updates a specific customer's loyalty tier based on their current lifetime points.
 * This function fetches the customer's points, calculates the correct tier, and then
 * updates the customer's record in the database.
 * @param customerId - The ID of the customer whose tier needs to be updated.
 * @returns A promise that resolves when the update is complete.
 * @throws Will throw an error if the customer is not found.
 */
export const updateCustomerTier = async (customerId: number): Promise<void> => {
  console.log(`Updating tier for customerId: ${customerId}`);
  
  const customer = await db
    .selectFrom('customers')
    .select('lifetimePoints')
    .where('id', '=', customerId)
    .executeTakeFirstOrThrow();

  const lifetimePoints = customer.lifetimePoints || 0;
  
  const newTier = await calculateCustomerTier(lifetimePoints);

  console.log(`Assigning new tierId: ${newTier.id} to customerId: ${customerId}`);
  await db
    .updateTable('customers')
    .set({ tierId: newTier.id })
    .where('id', '=', customerId)
    .execute();
};