import { db } from "../../helpers/db";
import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const settingsToUpdate = schema.parse(json);

    if (settingsToUpdate.length === 0) {
      return new Response(superjson.stringify({ error: "No settings provided for update." }), { status: 400 });
    }

    const updatedSettings = await db.transaction().execute(async (trx) => {
      const results = [];
      for (const setting of settingsToUpdate) {
        const updated = await trx.updateTable('loyaltySettings')
          .set({
            settingValue: setting.settingValue,
            description: setting.description,
            updatedAt: new Date(),
          })
          .where('settingKey', '=', setting.settingKey)
          .returningAll()
          .executeTakeFirst();
        
        if (!updated) {
          // If the key doesn't exist, create it
          const created = await trx.insertInto('loyaltySettings')
            .values({
              settingKey: setting.settingKey,
              settingValue: setting.settingValue,
              description: setting.description,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          results.push(created);
        } else {
          results.push(updated);
        }
      }
      return results;
    });

    return new Response(superjson.stringify(updatedSettings satisfies OutputType));
  } catch (error) {
    console.error("Error updating loyalty settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to update loyalty settings: ${errorMessage}` }), { status: 400 });
  }
}