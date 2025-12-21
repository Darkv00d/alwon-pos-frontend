import { OutputType } from "./seed_admin_POST.schema";
import { db } from "../../helpers/db";
import { Kysely } from "kysely";
import { DB } from "../../helpers/schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";

async function findOrCreateAdminRole(trx: Kysely<DB>) {
  const adminRoleName = 'admin';
  let adminRole = await trx
    .selectFrom('roles')
    .where('name', '=', adminRoleName)
    .select('id')
    .executeTakeFirst();

  if (!adminRole) {
    adminRole = await trx
      .insertInto('roles')
      .values({ name: adminRoleName })
      .returning('id')
      .executeTakeFirstOrThrow();
    console.log(`Created 'admin' role with id: ${adminRole.id}`);
  }

  return adminRole;
}

export async function handle(request: Request) {
  try {
    const userCountResult = await db.selectFrom('users').select(db.fn.count('id').as('count')).executeTakeFirst();
    if (Number(userCountResult?.count) > 0) {
      return new Response(JSON.stringify({ error: "Cannot seed admin user. Users already exist in the database." } satisfies OutputType), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const json = await request.json();
    const { email, password, fullName } = json;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." } satisfies OutputType), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = await generatePasswordHash(password);

    await db.transaction().execute(async (trx) => {
      const adminRole = await findOrCreateAdminRole(trx);

      const newUser = await trx
        .insertInto('users')
        .values({
          email,
          passwordHash,
          fullName: fullName ?? null,
          role: 'admin', // Set denormalized role field
          isActive: true,
        })
        .returning('uuid')
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('userRole')
        .values({
          userUuid: newUser.uuid,
          roleId: adminRole.id,
        })
        .execute();
    });

    console.log(`Successfully seeded admin user with email: ${email}`);
    return new Response(JSON.stringify({ success: true } satisfies OutputType), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error seeding admin user:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage } satisfies OutputType), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}