import { withAuth } from '../../../helpers/withAuth';
import { db } from '../../../helpers/db';
import { generatePasswordHash } from '../../../helpers/generatePasswordHash';
import { OutputType } from "./set-default-pins_POST.schema";
import superjson from "superjson";
import { User } from '../../../helpers/User';

const DEFAULT_PIN = "1234";

async function authenticatedHandle(
request: Request,
user: User)
: Promise<Response> {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Forbidden: Administrator access required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const customersToUpdate = await db.
    selectFrom("customers").
    select("id").
    where((eb) =>
    eb.or([eb("pinEnabled", "=", false), eb("pinHash", "is", null)])
    ).
    execute();

    if (customersToUpdate.length === 0) {
      const response: OutputType = {
        success: true,
        customersUpdated: 0,
        customerIds: [],
        message: "No customers found without a PIN. All customers are already configured.",
        defaultPin: DEFAULT_PIN
      };
      return new Response(superjson.stringify(response), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const customerIds = customersToUpdate.map((c) => c.id);
    const pinHash = await generatePasswordHash(DEFAULT_PIN);

    const updateResult = await db.
    updateTable("customers").
    set({
      pinHash: pinHash,
      pinEnabled: true,
      pinSetAt: new Date()
    }).
    where("id", "in", customerIds).
    executeTakeFirst();

    const numAffectedRows = Number(updateResult.numUpdatedRows ?? 0);

    console.log(`Set default PIN for ${numAffectedRows} customers.`);

    const response: OutputType = {
      success: true,
      customersUpdated: numAffectedRows,
      customerIds: customerIds,
      message: `Successfully set the default PIN for ${numAffectedRows} customers. Please inform them that their new PIN is "${DEFAULT_PIN}".`,
      defaultPin: DEFAULT_PIN
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error setting default PINs for customers:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(
      superjson.stringify({ error: `Failed to set default PINs: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const handle = withAuth(authenticatedHandle);