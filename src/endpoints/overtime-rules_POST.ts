import { db } from "../helpers/db";
import { schema, type OutputType } from "./overtime-rules_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const now = new Date();

    const updatedRules = await db.transaction().execute(async (trx) => {
      // Expire the old rule
      await trx.updateTable('overtimeRules')
        .set({ effectiveTo: now })
        .where('effectiveTo', 'is', null)
        .execute();

      // Insert the new rule
      const newRule = await trx.insertInto('overtimeRules')
        .values({
          ...input,
          effectiveFrom: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      
      return newRule;
    });

    return new Response(superjson.stringify(updatedRules satisfies OutputType));
  } catch (error) {
    console.error("Error updating overtime rules:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update overtime rules: ${errorMessage}` }), { status: 500 });
  }
}