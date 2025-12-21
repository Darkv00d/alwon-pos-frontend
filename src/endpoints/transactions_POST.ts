import { db } from "../helpers/db";
import { schema, OutputType, TransactionItemSchema } from "./transactions_POST.schema";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB } from "../helpers/schema";
import { z } from "zod";
import { getProductStock, allocateFEFO } from "../helpers/inventoryLogic";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "../helpers/rateLimit";

type TransactionItemInput = z.infer<typeof TransactionItemSchema>;
type PaymentInput = {
  method: 'card' | 'cash' | 'credit' | 'digital_wallet' | 'points' | 'hybrid';
  amount: number;
  pointsAmount?: number;
  cardTransactionId?: string;
};

// Get writeLocId from header 
function getWriteLocFromReq(req: Request) {
  const v = req.headers.get('x-location-id') || '';
  return v ? Number(v) : null;
}

async function processTransaction(trx: Transaction<DB>, items: TransactionItemInput[], payments: PaymentInput[], locationId: number | null, customerId?: number) {
  const productIds = items.map(item => item.productId);
  const products = await trx.selectFrom('products')
    .where('id', 'in', productIds)
    .selectAll()
    .execute();

  const productMap = new Map(products.map(p => [p.id, p]));
  let totalAmount = 0;

  // Validate products exist and get FEFO allocations for each item
  const allocations: Array<{ productId: number; lotId: string; quantity: number }> = [];
  
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    if (!product.uuid) {
      throw new Error(`Product "${product.name}" is missing UUID and cannot be processed.`);
    }

    // Use centralized stock validation
    const availableStock = await getProductStock(product.uuid);
    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for product "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}.`);
    }

    // Get FEFO allocation plan
    const productAllocations = await allocateFEFO(product.uuid, item.quantity, trx);
    
    // Add product ID to each allocation for later processing
    for (const allocation of productAllocations) {
      allocations.push({
        productId: item.productId,
        lotId: allocation.lotId,
        quantity: allocation.quantity
      });
    }

    totalAmount += parseFloat(product.price) * item.quantity;
  }

  // Validate payments that include points
  let totalPointsToRedeem = 0;
  for (const payment of payments) {
    if (payment.method === 'points' || payment.method === 'hybrid') {
      if (!customerId) {
        throw new Error(`Points or hybrid payments require a customerId.`);
      }
      if (!payment.pointsAmount || payment.pointsAmount <= 0) {
        throw new Error(`Points or hybrid payments must include a positive pointsAmount.`);
      }
      if (payment.pointsAmount > payment.amount) {
        throw new Error(`Points amount (${payment.pointsAmount}) cannot exceed payment amount (${payment.amount}).`);
      }
      totalPointsToRedeem += payment.pointsAmount;
    }
  }

  // Verify customer has sufficient points if points are being redeemed
  if (totalPointsToRedeem > 0 && customerId) {
    const customer = await trx.selectFrom('customers')
      .where('id', '=', customerId)
      .select('totalPoints')
      .executeTakeFirst();

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found.`);
    }

    if (customer.totalPoints === null || customer.totalPoints < totalPointsToRedeem) {
      throw new Error(`Insufficient points. Available: ${customer.totalPoints ?? 0}, Required: ${totalPointsToRedeem}.`);
    }
  }

  // Validate payment amounts sum to total
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  if (Math.abs(totalPayments - totalAmount) > 0.01) {
    throw new Error(
      `Payment mismatch. Total: ${totalAmount}, Paid: ${totalPayments}`
    );
  }

  // Use the first payment method for the transaction record (for backward compatibility)
  // In the future, this could be changed to a more sophisticated approach
  const primaryPaymentMethod = payments[0].method;

  const newTransaction = await trx.insertInto('transactions')
    .values({
      paymentMethod: primaryPaymentMethod,
      totalAmount: totalAmount.toString(),
      createdAt: new Date(),
      locationId: locationId ?? null,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  const transactionId = newTransaction.id;

  // Process points redemption BEFORE card payments (to ensure atomicity and fail fast)
  if (totalPointsToRedeem > 0 && customerId) {
    console.log(`Redeeming ${totalPointsToRedeem} points for customer ${customerId} in transaction ${transactionId}`);
    
    // Create redeemed points transaction
    await trx.insertInto('pointsTransactions')
      .values({
        customerId,
        pointsAmount: -totalPointsToRedeem, // Negative for redemption
        transactionType: 'redeemed',
        transactionId: transactionId,
        description: `Points redeemed for transaction #${transactionId}`,
      })
      .execute();

    // Deduct points from customer's balance
    await trx.updateTable('customers')
      .set((eb) => ({
        totalPoints: eb('totalPoints', '-', totalPointsToRedeem),
      }))
      .where('id', '=', customerId)
      .execute();

    console.log(`Successfully redeemed ${totalPointsToRedeem} points for customer ${customerId}`);
  }

  // Insert payment records
  for (const payment of payments) {
    await trx.insertInto('payments').values({
      transactionId,
      method: payment.method,
      amount: payment.amount.toString(),
    }).execute();
  }

  const transactionItemsToInsert = items.map(item => {
    const product = productMap.get(item.productId)!;
    return {
      transactionId: transactionId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  await trx.insertInto('transactionItems')
    .values(transactionItemsToInsert)
    .execute();

  // Create stock movements using FEFO allocations
  const stockMovementsToInsert = allocations.map(allocation => {
    const product = productMap.get(allocation.productId)!;
    return {
      productUuid: product.uuid!,
      lotId: allocation.lotId,
      locationId: locationId ?? null,
      type: 'SALE' as const,
      qty: (-allocation.quantity).toString(), // Negative for sales (outbound movement)
      ref: `tx:${transactionId}`,
      createdAt: new Date(),
    };
  });

  await trx.insertInto('stockMovements')
    .values(stockMovementsToInsert)
    .execute();

  // Update product stock quantities based on total consumed
  for (const item of items) {
    await trx.updateTable('products')
      .set(eb => ({
        stockQuantity: eb('stockQuantity', '-', item.quantity)
      }))
      .where('id', '=', item.productId)
      .execute();
  }

  const finalTransaction = await trx.selectFrom('transactions')
    .where('id', '=', transactionId)
    .selectAll()
    .executeTakeFirstOrThrow();

  const finalTransactionItems = await trx.selectFrom('transactionItems')
    .where('transactionId', '=', transactionId)
    .selectAll()
    .execute();

  // Award points con tier multiplier y campañas
  if (customerId) {
    const customer = await trx
      .selectFrom("customers")
      .leftJoin("customerTiers", "customerTiers.id", "customers.tierId")
      .select([
        "customers.lifetimePoints",
        "customers.tierId",
        "customerTiers.pointsMultiplier",
        "customerTiers.discountPercentage",
      ])
      .where("customers.id", "=", customerId)
      .executeTakeFirstOrThrow();

    const loyaltySettings = await trx
      .selectFrom("loyaltySettings")
      .selectAll()
      .execute();
    
    const pointsRateSetting = loyaltySettings.find(
      (s) => s.settingKey === "points_per_dollar"
    );
    
    if (pointsRateSetting) {
      let basePoints = Math.floor(totalAmount * Number(pointsRateSetting.settingValue));
      
      // Aplicar multiplicador de tier
      const tierMultiplier = Number(customer.pointsMultiplier || 1);
      basePoints = Math.floor(basePoints * tierMultiplier);

      // Verificar si hay campaña activa
      const now = new Date();
      const activeCampaign = await trx
        .selectFrom("loyaltyCampaigns")
        .innerJoin("campaignProducts", "campaignProducts.campaignId", "loyaltyCampaigns.id")
        .select(["loyaltyCampaigns.pointsMultiplier"])
        .where("loyaltyCampaigns.isActive", "=", true)
        .where("loyaltyCampaigns.startDate", "<=", now)
        .where("loyaltyCampaigns.endDate", ">=", now)
        .where("campaignProducts.productId", "in", items.map(i => i.productId))
        .executeTakeFirst();

      if (activeCampaign) {
        const campaignMultiplier = Number(activeCampaign.pointsMultiplier);
        basePoints = Math.floor(basePoints * campaignMultiplier);
      }

      if (basePoints > 0) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 12); // Puntos expiran en 12 meses

        await trx
          .insertInto("pointsTransactions")
          .values({
            customerId,
            pointsAmount: basePoints,
            transactionType: "earned",
            transactionId: transactionId,
            description: `Puntos ganados (tier: ${tierMultiplier}x)`,
            expiresAt,
          })
          .execute();

        await trx
          .updateTable("customers")
          .set((eb) => ({
            totalPoints: eb("totalPoints", "+", basePoints),
            lifetimePoints: eb("lifetimePoints", "+", basePoints),
          }))
          .where("id", "=", customerId)
          .execute();

        // Actualizar tier si es necesario
        const newLifetimePoints = (customer.lifetimePoints || 0) + basePoints;
        const { calculateCustomerTier } = await import("../helpers/loyaltyTiers");
        const newTier = await calculateCustomerTier(newLifetimePoints);
        
        if (newTier.id !== customer.tierId) {
          await trx
            .updateTable("customers")
            .set({ tierId: newTier.id })
            .where("id", "=", customerId)
            .execute();
        }
      }
    }
  }

  return { ...finalTransaction, items: finalTransactionItems };
}

export async function handle(request: Request) {
  // Apply rate limiting to prevent payment processing abuse
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.PAYMENT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const json = superjson.parse(await request.text());
    const { items, payments, customerId } = schema.parse(json);
    
    // Get writeLocId from header 
    const writeLocId = getWriteLocFromReq(request);

    const result = await db.transaction().execute(async (trx) => {
      // Validate locationId exists if provided
      if (writeLocId !== null) {
        const location = await trx.selectFrom('locations')
          .where('id', '=', writeLocId)
          .where('isActive', '=', true)
          .selectAll()
          .executeTakeFirst();

        if (!location) {
          throw new Error(`Location with ID ${writeLocId} not found or inactive.`);
        }
      }

      return processTransaction(trx, items, payments, writeLocId, customerId);
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error processing transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to process transaction: ${errorMessage}` }), { status: 400 });
  }
}