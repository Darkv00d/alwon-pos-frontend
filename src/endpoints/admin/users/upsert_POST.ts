import { z } from "zod";
import superjson from 'superjson';
import { db } from "../../../helpers/db";
import { schema, OutputType } from "./upsert_POST.schema";
import { requireModuleAccess, ForbiddenError } from "../../../helpers/moduleAuth";
import { generatePasswordHash } from "../../../helpers/generatePasswordHash";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "../../../helpers/rateLimit";

export async function handle(request: Request) {
  try {
    // Apply rate limiting before authentication to prevent abuse
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.ADMIN);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await requireModuleAccess(request, 'ADMIN', 'write');

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { uuid, password, roleNames, dateOfBirth, identificationType, identificationNumber, ...userData } = input;

    const userUuid = await db.transaction().execute(async (trx) => {
      let targetUserUuid: string;

      // Step 1: Upsert user record
      if (uuid) {
        // Update existing user
        const updateData: any = { ...userData };
        if (password) {
          updateData.passwordHash = await generatePasswordHash(password);
        }
        if (dateOfBirth) {
          updateData.dateofbirth = dateOfBirth;
        }
        if (identificationType) {
          updateData.identificationtype = identificationType;
        }
        if (identificationNumber) {
          updateData.identificationnumber = identificationNumber;
        }

        const updatedUser = await trx
          .updateTable('users')
          .set(updateData)
          .where('uuid', '=', uuid)
          .returning('uuid')
          .executeTakeFirst();

        if (!updatedUser) {
          throw new Error(`User with UUID ${uuid} not found.`);
        }
        targetUserUuid = updatedUser.uuid;
      } else {
        // Create new user
        if (!password) {
          // This should be caught by the schema validation, but as a safeguard:
          throw new Error("Password is required for new users.");
        }
        const passwordHash = await generatePasswordHash(password);
        const insertData: any = {
          ...userData,
          passwordHash,
        };
        if (dateOfBirth) {
          insertData.dateofbirth = dateOfBirth;
        }
        if (identificationType) {
          insertData.identificationtype = identificationType;
        }
        if (identificationNumber) {
          insertData.identificationnumber = identificationNumber;
        }
        const newUser = await trx
          .insertInto('users')
          .values(insertData)
          .returning('uuid')
          .executeTakeFirstOrThrow();
        targetUserUuid = newUser.uuid;
      }

      // Step 2: Sync user roles
      // Get role IDs from role names
      const roles = await trx
        .selectFrom('roles')
        .select('id')
        .where('name', 'in', roleNames)
        .execute();

      if (roles.length !== roleNames.length) {
        throw new Error("One or more specified roles do not exist.");
      }

      // Clear existing roles for the user
      await trx
        .deleteFrom('userRole')
        .where('userUuid', '=', targetUserUuid)
        .execute();

      // Insert new roles if any are provided
      if (roles.length > 0) {
        const newRoleAssignments = roles.map(role => ({
          userUuid: targetUserUuid,
          roleId: role.id,
        }));

        await trx
          .insertInto('userRole')
          .values(newRoleAssignments)
          .execute();
      }

      return targetUserUuid;
    });

    return new Response(superjson.stringify({ ok: true, userUuid } satisfies OutputType), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error upserting user:", error);

    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data.", details: error.errors }), { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 403 });
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to save user: ${errorMessage}` }), { status: 500 });
  }
}