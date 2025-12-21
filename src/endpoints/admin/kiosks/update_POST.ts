import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';
import { db } from "../../../helpers/db";
import { withAuth } from "../../../helpers/withAuth";
import { User } from "../../../helpers/User";
import { Kysely, Selectable, sql } from "kysely";
import { DB } from "../../../helpers/schema";
import { Transaction } from "kysely";

type KioskWithLocation = Omit<Selectable<DB['kiosks']>, 'isActive' | 'createdAt' | 'updatedAt'> & {
  isActive: boolean;      // non-nullable
  createdAt: Date;        // non-nullable
  updatedAt: Date;        // non-nullable
  locationName: string;
};

async function updateKiosk(
  input: {
    id: number;
    name?: string;
    isActive?: boolean;
    locationId?: number;
  },
  trx: Transaction<DB>
): Promise<KioskWithLocation> {
  const { id, ...updateData } = input;

  // 1. Verify kiosk exists
  const existingKiosk = await trx
    .selectFrom("kiosks")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!existingKiosk) {
    throw new Error("Kiosk not found");
  }

  // 2. If locationId is being updated, verify the new location exists
  if (updateData.locationId !== undefined && updateData.locationId !== existingKiosk.locationId) {
    const locationExists = await trx
      .selectFrom("locations")
      .select("id")
      .where("id", "=", updateData.locationId)
      .executeTakeFirst();

    if (!locationExists) {
      throw new Error("Location not found");
    }
  }

  // 3. Update kiosk if there's anything to update
  if (Object.keys(updateData).length > 0) {
    await trx
      .updateTable("kiosks")
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }

  // 4. Fetch and return the updated kiosk with location name
  const updatedKiosk = await trx
    .selectFrom("kiosks as k")
    .innerJoin("locations as l", "l.id", "k.locationId")
    .where("k.id", "=", id)
    .select([
      "k.id",
      "k.locationId",
      "l.name as locationName",
      "k.deviceCode",
      "k.deviceIdentifier",
      "k.name",
      sql<boolean>`COALESCE(k.is_active, true)`.as("isActive"),
      "k.lastSeenAt",
      sql<Date>`COALESCE(k.created_at, CURRENT_TIMESTAMP)`.as('createdAt'),
      sql<Date>`COALESCE(k.updated_at, CURRENT_TIMESTAMP)`.as('updatedAt'),
    ])
    .executeTakeFirstOrThrow();

  return updatedKiosk;
}

export const handle = withAuth(async (request: Request, user: User) => {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Forbidden" }),
      { status: 403 }
    );
  }

  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedKiosk = await db.transaction().execute(async (trx) => {
      return updateKiosk(input, trx);
    });

    return new Response(
      superjson.stringify({ success: true, kiosk: updatedKiosk } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error updating kiosk:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      superjson.stringify({ success: false, error: errorMessage } satisfies OutputType),
      { status: 400 }
    );
  }
});