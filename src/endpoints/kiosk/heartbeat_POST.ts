import { db } from "../../helpers/db";
import { schema } from "./heartbeat_POST.schema";

export const handle = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: parsed.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { locationId, deviceCode } = parsed.data;

    // Validate that locationId exists
    const location = await db
      .selectFrom("locations")
      .select("id")
      .where("id", "=", locationId)
      .executeTakeFirst();

    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Look up kiosk by deviceCode
    let kiosk = await db
      .selectFrom("kiosks")
      .select(["id", "name", "locationId", "deviceCode"])
      .where("deviceCode", "=", deviceCode)
      .executeTakeFirst();

    if (kiosk) {
      // Kiosk exists, update last_seen_at
      await db
        .updateTable("kiosks")
        .set({ lastSeenAt: new Date() })
        .where("deviceCode", "=", deviceCode)
        .execute();

      console.log(`Kiosk heartbeat updated: ${kiosk.name} (${deviceCode})`);

      return new Response(
        JSON.stringify({
          success: true,
          kiosk: {
            id: kiosk.id,
            name: kiosk.name,
            locationId: kiosk.locationId,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Kiosk doesn't exist, create new one with auto-generated name
      
      // Count existing kiosks at this location
      const countResult = await db
        .selectFrom("kiosks")
        .select(db.fn.count<number>("id").as("count"))
        .where("locationId", "=", locationId)
        .executeTakeFirst();

      const count = Number(countResult?.count ?? 0);
      
      let name: string;
      if (count === 0) {
        name = "Kiosk Principal";
      } else if (count === 1) {
        name = "Kiosk Secundario";
      } else {
        name = `Kiosk ${count + 1}`;
      }

      // Create new kiosk
      const newKiosk = await db
        .insertInto("kiosks")
        .values({
          deviceCode,
          locationId,
          name,
          lastSeenAt: new Date(),
          isActive: true,
        })
        .returning(["id", "name", "locationId"])
        .executeTakeFirst();

      if (!newKiosk) {
        return new Response(
          JSON.stringify({ error: "Failed to create kiosk" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`New kiosk created: ${newKiosk.name} at location ${locationId} (${deviceCode})`);

      return new Response(
        JSON.stringify({
          success: true,
          kiosk: {
            id: newKiosk.id,
            name: newKiosk.name,
            locationId: newKiosk.locationId,
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in /kiosk/heartbeat:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};