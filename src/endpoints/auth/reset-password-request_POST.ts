import { schema, OutputType } from "./reset-password-request_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { randomUUID } from "crypto";
import { addHours } from "date-fns";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "../../helpers/rateLimit";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { email } = schema.parse(json);

    // Apply rate limiting to prevent abuse
    const normalizedEmail = email.toLowerCase();
    const rateLimitResponse = await applyRateLimit(
      request, 
      RATE_LIMIT_CONFIGS.PASSWORD_RESET, 
      normalizedEmail
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await db
      .selectFrom('users')
      .select('uuid')
      .where('email', '=', normalizedEmail)
      .where('isActive', '=', true)
      .executeTakeFirst();

    if (user) {
      const token = randomUUID();
      const expiresAt = addHours(new Date(), 1);

      await db
        .insertInto('passwordResetTokens')
        .values({
          userUuid: user.uuid,
          token,
          expiresAt,
        })
        .execute();

      // TODO: In production, send an email to the user with the reset link.
      // The token should not be returned in the response.
      console.log(`Password reset token for ${normalizedEmail}: ${token}`);

      const response: OutputType = {
        message: "If an account with that email exists, a password reset link has been sent.",
        // This is for development purposes only and should be removed in production.
        token: token,
      };
      return new Response(superjson.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Always return the same success message to prevent email enumeration attacks.
    const response: OutputType = {
      message: "If an account with that email exists, a password reset link has been sent.",
    };
    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Password reset request failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: error instanceof Error ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}