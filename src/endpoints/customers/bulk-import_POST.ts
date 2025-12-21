import superjson from 'superjson';
import { db } from '../../helpers/db';
import { generatePasswordHash } from '../../helpers/generatePasswordHash';
import { generateRandomPIN } from '../../helpers/pinUtils';
import { schema, InputType, OutputType } from './bulk-import_POST.schema';
import { nanoid } from 'nanoid';
import { Transaction } from 'kysely';
import { DB } from '../../helpers/schema';

async function processCustomer(customer: InputType['customers'][0], generatePin: boolean, trx: Transaction<DB>) {
  const { firstName, lastName, email, idType, idNumber, mobile, locationId, apartment, dateOfBirth } = customer;

  // Check for duplicates within the transaction
  const existingCustomer = await trx
    .selectFrom('customers')
    .select('id')
    .where((eb) => {
      const conditions = [eb('idNumber', '=', idNumber)];
      if (email) conditions.push(eb('email', '=', email));
      if (mobile) conditions.push(eb('mobile', '=', mobile));
      return eb.or(conditions);
    })
    .executeTakeFirst();

  if (existingCustomer) {
    throw new Error(`Duplicate entry for email, mobile, or ID number: ${email}, ${mobile}, ${idNumber}`);
  }

  const plainPin = generatePin ? generateRandomPIN() : null;
  const pinHash = plainPin ? await generatePasswordHash(plainPin) : null;

  const newCustomer = await trx
    .insertInto('customers')
    .values({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      idType,
      idNumber,
      mobile,
      locationId,
      apartment,
      dateOfBirth,
      customerNumber: nanoid(10),
      pinHash,
      pinEnabled: !!pinHash,
      pinSetAt: pinHash ? new Date() : null,
    })
    .returning(['customerNumber', 'name'])
    .executeTakeFirstOrThrow();

  return {
    ...newCustomer,
    pin: plainPin,
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { customers, generatePin } = schema.parse(json);

    const results: { customerNumber: string; name: string; pin: string | null }[] = [];
    let importedCount = 0;
    let failedCount = 0;

    // Process customers one by one with individual transactions to report partial success
    for (const customer of customers) {
      try {
        const result = await db.transaction().execute(async (trx) => {
          return await processCustomer(customer, generatePin, trx);
        });
        results.push(result);
        importedCount++;
      } catch (error) {
        console.error(`Failed to import customer ${customer.firstName} ${customer.lastName}:`, error);
        failedCount++;
      }
    }

    const output: OutputType = {
      imported: importedCount,
      failed: failedCount,
      customers: results,
    };

    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}