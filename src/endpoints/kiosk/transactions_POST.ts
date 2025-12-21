import { db } from "../../helpers/db";
import { schema, OutputType, TransactionItemSchema } from "./transactions_POST.schema";
import superjson from 'superjson';
import { type Transaction } from "kysely";
import { type DB, PaymentMethod } from "../../helpers/schema";
import { z } from "zod";
import { allocateFEFO } from "../../helpers/inventoryLogic";
import { nanoid } from "nanoid";

type TransactionItemInput = z.infer<typeof TransactionItemSchema>;

async function processKioskTransaction(trx: Transaction<DB>, items: TransactionItemInput[], paymentMethod: PaymentMethod, locationId: number, customerId?: number) {
  const productIds = items.map(item => item.productId);
  const products = await trx.selectFrom('products')
    .where('id', 'in', productIds)
    .selectAll()
    .execute();

  const productMap = new Map(products.map(p => [p.id, p]));
  let totalAmount = 0;

  // Validate stock and calculate total for kiosk transactions
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    if (!product.uuid) {
      throw new Error(`Product "${product.name}" is missing UUID and cannot be processed.`);
    }

    // Simple stock validation using products.stockQuantity
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`);
    }

    totalAmount += parseFloat(product.price) * item.quantity;
  }

  const newTransaction = await trx.insertInto('transactions')
    .values({
      paymentMethod,
      totalAmount: totalAmount.toString(),
      createdAt: new Date(),
      locationId: locationId,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  const transactionId = newTransaction.id;

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

  // Use FEFO allocation for kiosk transactions
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    
    // Allocate using FEFO logic
    const allocations = await allocateFEFO(product.uuid!, item.quantity, trx);
    
    // Create stock movements for each allocation
    for (const allocation of allocations) {
      await trx.insertInto('stockMovements')
        .values({
          id: nanoid(),
          productUuid: product.uuid!,
          lotId: allocation.lotId, // Use allocated lot
          locationId: locationId,
          type: 'SALE' as const,
          qty: (-allocation.quantity).toString(), // Negative for sales (outbound movement)
          ref: `tx:${transactionId}`,
          createdAt: new Date(),
        })
        .execute();
    }

    // Update product stock quantity
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

  if (customerId) {
    const loyaltySettings = await trx.selectFrom('loyaltySettings').selectAll().execute();
    const pointsRateSetting = loyaltySettings.find(s => s.settingKey === 'points_per_dollar');
    if (pointsRateSetting) {
      const pointsToAward = Math.floor(totalAmount * Number(pointsRateSetting.settingValue));
      if (pointsToAward > 0) {
        await trx.insertInto('pointsTransactions')
          .values({
            customerId,
            pointsAmount: pointsToAward,
            transactionType: 'earned',
            transactionId: transactionId,
            description: `Points earned from transaction #${transactionId}`,
          })
          .execute();
        await trx.updateTable('customers')
          .set(eb => ({
            totalPoints: eb('totalPoints', '+', pointsToAward),
            lifetimePoints: eb('lifetimePoints', '+', pointsToAward),
          }))
          .where('id', '=', customerId)
          .execute();
      }
    }
  }

  return { ...finalTransaction, items: finalTransactionItems };
}

export async function handle(request: Request) {
  try {
    const locationIdHeader = request.headers.get('X-Location-Id');
    if (!locationIdHeader) {
      throw new Error("X-Location-Id header is required for kiosk transactions.");
    }
    const locationId = parseInt(locationIdHeader, 10);
    if (isNaN(locationId) || locationId <= 0) {
      throw new Error("Invalid X-Location-Id header provided.");
    }

    const json = superjson.parse(await request.text());
    const { items, paymentMethod, customerId } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      const location = await trx.selectFrom('locations')
        .where('id', '=', locationId)
        .where('isActive', '=', true)
        .select('id')
        .executeTakeFirst();

      if (!location) {
        throw new Error(`Kiosk location with ID ${locationId} not found or is inactive.`);
      }

      return processKioskTransaction(trx, items, paymentMethod, locationId, customerId);
    });

    return new Response(superjson.stringify(result satisfies OutputType), { status: 201 });
  } catch (error) {
    console.error("Error processing kiosk transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to process kiosk transaction: ${errorMessage}` }), { status: 400 });
  }
}