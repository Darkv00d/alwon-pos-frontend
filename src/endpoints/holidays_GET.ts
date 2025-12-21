import { db } from "../helpers/db";
import { type OutputType } from "./holidays_GET.schema";
import superjson from 'superjson';

// Data for Colombian holidays
const colombianHolidays = (year: number) => [
  { name: "Año Nuevo", date: new Date(year, 0, 1) },
  { name: "Día de los Reyes Magos", date: new Date(year, 0, 6) },
  { name: "Día de San José", date: new Date(year, 2, 19) },
  // Add more fixed and movable holidays as needed
];

export async function handle(request: Request) {
  try {
    // For this example, we'll add Colombian holidays for the current year if they don't exist.
    // A more robust solution would use a proper holiday calculation library.
    const currentYear = new Date().getFullYear();
    const holidaysToEnsure = colombianHolidays(currentYear);

    await db.transaction().execute(async (trx) => {
      for (const holiday of holidaysToEnsure) {
        await trx.insertInto('holidays')
          .values(holiday)
          .onConflict((oc) => oc.column('date').doNothing())
          .execute();
      }
    });

    const holidays = await db.selectFrom('holidays')
      .selectAll()
      .orderBy('date', 'asc')
      .execute();

    return new Response(superjson.stringify(holidays satisfies OutputType));
  } catch (error) {
    console.error("Error fetching holidays:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch holidays: ${errorMessage}` }), { status: 500 });
  }
}