import { db } from "../helpers/db";
import { type OutputType } from "./overtime-rules_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    // Get the currently effective overtime rule
    let rules = await db.selectFrom('overtimeRules')
      .selectAll()
      .where('effectiveTo', 'is', null)
      .orderBy('effectiveFrom', 'desc')
      .limit(1)
      .executeTakeFirst();

    // If no rule exists, create a default one
    if (!rules) {
      rules = await db.insertInto('overtimeRules')
        .values({
          dailyThresholdMinutes: 480, // 8 hours
          weeklyThresholdMinutes: 2400, // 40 hours
          nightStart: '21:00',
          nightEnd: '06:00',
          nightMultiplier: '1.5',
          holidayMultiplier: '2.0',
          effectiveFrom: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return new Response(superjson.stringify(rules satisfies OutputType));
  } catch (error) {
    console.error("Error fetching overtime rules:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch overtime rules: ${errorMessage}` }), { status: 500 });
  }
}