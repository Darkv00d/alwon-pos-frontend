import { db } from "./db";
import { sql } from "kysely";

/**
 * Configuration for the rate limiter.
 * @param maxRequests - The maximum number of requests allowed within the time window.
 * @param windowMinutes - The duration of the time window in minutes.
 * @param keyPrefix - A prefix to create a unique namespace for the rate limit key (e.g., 'login', 'password-reset').
 */
export type RateLimitConfig = {
  maxRequests: number;
  windowMinutes: number;
  keyPrefix: string;
};

/**
 * Checks if a given identifier has exceeded the rate limit based on the provided configuration.
 * This function uses the `loginAttempts` table to track requests.
 *
 * @param identifier - A unique string identifying the entity being rate-limited (e.g., an email address, IP address, or user ID).
 * @param config - The rate limit configuration.
 * @returns A promise that resolves to an object indicating if the request is allowed.
 *          If not allowed, it includes the approximate number of minutes remaining until the limit resets.
 */
// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    maxRequests: 5,
    windowMinutes: 15,
    keyPrefix: "login"
  },
  PAYMENT: {
    maxRequests: 10,
    windowMinutes: 5,
    keyPrefix: "payment"
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMinutes: 60,
    keyPrefix: "pwd_reset"
  },
  ADMIN: {
    maxRequests: 20,
    windowMinutes: 10,
    keyPrefix: "admin"
  }
} as const;

/**
 * Helper function to apply rate limiting in endpoints.
 * Returns a Response object if rate limit is exceeded, null if request should proceed.
 * 
 * @param request - The incoming Request object
 * @param config - Rate limit configuration
 * @param identifier - Optional custom identifier (defaults to client IP)
 * @returns Promise<Response | null> - Response if blocked, null if allowed
 */
export async function applyRateLimit(
  request: Request,
  config: RateLimitConfig,
  identifier?: string
): Promise<Response | null> {
  const ip = getClientIP(request);
  const key = identifier || ip;
  
  const result = await checkRateLimit(key, config);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: `Too many requests. Try again in ${result.remainingMinutes} minutes.`,
        retryAfter: result.remainingMinutes
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": (result.remainingMinutes! * 60).toString()
        }
      }
    );
  }
  
  return null; // Allow request
}

/**
 * Extracts the client IP address from the request headers.
 * 
 * @param request - The incoming Request object
 * @returns The client IP address or "unknown" if not found
 */
function getClientIP(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIP = request.headers.get("x-real-ip");
  
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  return "unknown";
}

/**
 * Obtiene métricas de rate limiting para monitoreo
 */
export async function getRateLimitMetrics(keyPrefix: string): Promise<{
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  activeWindows: number;
}> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const metrics = await db
    .selectFrom("loginAttempts")
    .select([
      db.fn.countAll<number>().as("totalAttempts"),
      db.fn.count<number>("success").filterWhere("success", "=", true).as("successfulAttempts"),
      db.fn.count<number>("success").filterWhere("success", "=", false).as("failedAttempts"),
    ])
    .where("email", "like", `${keyPrefix}:%`)
    .where("attemptedAt", ">=", oneDayAgo)
    .executeTakeFirst();

  // Contar ventanas activas (últimos 60 minutos)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const activeWindows = await db
    .selectFrom("loginAttempts")
    .select(db.fn.countAll<number>().as("count"))
    .where("email", "like", `${keyPrefix}:%`)
    .where("attemptedAt", ">=", oneHourAgo)
    .executeTakeFirst();

  return {
    totalAttempts: metrics?.totalAttempts || 0,
    successfulAttempts: metrics?.successfulAttempts || 0,
    failedAttempts: metrics?.failedAttempts || 0,
    activeWindows: activeWindows?.count || 0,
  };
}

/**
 * Limpia intentos expirados para mantenimiento de la base de datos
 */
export async function clearExpiredAttempts(olderThanHours: number = 24): Promise<number> {
  const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  
  const result = await db
    .deleteFrom("loginAttempts")
    .where("attemptedAt", "<", cutoffTime)
    .where("attemptedAt", "is not", null)
    .executeTakeFirst();
    
  return Number(result.numDeletedRows || 0);
}

/**
 * Verifica el estado de rate limiting sin registrar un nuevo intento
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<{ 
  allowed: boolean; 
  remainingRequests: number; 
  resetTime: Date;
  remainingMinutes?: number;
}> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  const key = `${config.keyPrefix}:${identifier}`;

  const result = await db
    .selectFrom("loginAttempts")
    .select([db.fn.countAll<number>().as("requestCount")])
    .where("email", "=", key)
    .where("attemptedAt", ">=", windowStart)
    .executeTakeFirst();

  const requestCount = result?.requestCount || 0;
  const allowed = requestCount < config.maxRequests;
  const remainingRequests = Math.max(0, config.maxRequests - requestCount);
  const resetTime = new Date(windowStart.getTime() + config.windowMinutes * 60 * 1000);

  return {
    allowed,
    remainingRequests,
    resetTime,
    remainingMinutes: allowed ? undefined : config.windowMinutes,
  };
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remainingMinutes?: number }> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - config.windowMinutes * 60 * 1000
  );

  // The key is stored in the `email` column of the `loginAttempts` table.
  // This is a pragmatic use of an existing table to avoid schema changes.
  const key = `${config.keyPrefix}:${identifier}`;

  try {
    // Atomically get the count of recent attempts.
    const attempts = await db
      .selectFrom("loginAttempts")
      .select("attemptedAt")
      .where("email", "=", key)
      .where("attemptedAt", ">=", windowStart)
      .orderBy("attemptedAt", "asc")
      .execute();

    const requestCount = attempts.length;

    if (requestCount >= config.maxRequests) {
      // This request is denied. Calculate when the user can try again.
      const oldestRelevantAttempt = attempts[0]; // The first attempt in the window
      const resetTime = new Date(
        oldestRelevantAttempt.attemptedAt!.getTime() +
          config.windowMinutes * 60 * 1000
      );
      const remainingMilliseconds = resetTime.getTime() - now.getTime();
      const remainingMinutes = Math.max(
        0,
        Math.ceil(remainingMilliseconds / (1000 * 60))
      );

      console.warn(
        `Rate limit exceeded for identifier: "${identifier}" with prefix: "${config.keyPrefix}". Requests in window: ${requestCount}.`
      );

      return {
        allowed: false,
        remainingMinutes: remainingMinutes,
      };
    }

    // This request is allowed. Log the new attempt.
    // The `success` column is hardcoded to `false` as this table is tracking attempts,
    // not the success of the operation itself (e.g., a successful login).
    await db
      .insertInto("loginAttempts")
      .values({
        email: key,
        attemptedAt: now,
        success: false, // Using false to indicate this is a generic attempt, not a successful login.
      })
      .execute();

    return { allowed: true };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // Fail open: In case of a database error, we allow the request to proceed
    // to avoid blocking users due to an issue in the rate-limiting logic itself.
    return { allowed: true };
  }
}