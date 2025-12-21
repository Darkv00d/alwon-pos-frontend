import { OutputType } from "./health_GET.schema";
import superjson from 'superjson';
import { db } from "../helpers/db";
import { sql } from "kysely";
import { runAllValidations } from "../helpers/dataValidation";

type CheckStatus = 'ok' | 'error';

interface CheckResult {
  status: CheckStatus;
  message: string;
  durationMs?: number;
}

const checkDatabase = async (): Promise<CheckResult> => {
  const startTime = performance.now();
  try {
    await sql`SELECT 1`.execute(db);
    const durationMs = performance.now() - startTime;
    return { status: 'ok', message: 'Database connection successful.', durationMs: parseFloat(durationMs.toFixed(2)) };
  } catch (error) {
    const durationMs = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error("Database health check failed:", error);
    return { status: 'error', message: `Database connection failed: ${errorMessage}`, durationMs: parseFloat(durationMs.toFixed(2)) };
  }
};

const checkConfig = (): CheckResult => {
  const requiredEnvVars = [
    'FLOOT_DATABASE_URL',
    'JWT_SECRET',
    'BCRYPT_ROUNDS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CURRENCY',
    'LOCALE',
    'TIMEZONE',
    'TAX_RATE',
    'COMPANY_NAME',
  ];

  const missingVars = requiredEnvVars.filter(v => !(process.env as any)[v]);

  if (missingVars.length > 0) {
    return {
      status: 'error',
      message: `Missing critical environment variables: ${missingVars.join(', ')}`,
    };
  }

  return { status: 'ok', message: 'All critical configurations are present.' };
};

export async function handle(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === 'true';
  const startTime = performance.now();

  try {
    const [dbCheck, configCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkConfig()),
    ]);

    let dataValidationResults = null;
    if (deep) {
      console.log("Performing deep health check with data validations.");
      dataValidationResults = await runAllValidations();
    }

    const overallStatus: CheckStatus = (dbCheck.status === 'ok' && configCheck.status === 'ok') ? 'ok' : 'error';
    const httpStatus = overallStatus === 'ok' ? 200 : 503;

    const response: OutputType = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: dbCheck,
        configuration: configCheck,
        ...(deep && { dataValidation: dataValidationResults }),
      },
      metrics: {
        totalDurationMs: parseFloat((performance.now() - startTime).toFixed(2)),
      },
    };

    return new Response(superjson.stringify(response), {
      status: httpStatus,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Unexpected error during health check:", error);
    const response: OutputType = {
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: { status: 'error', message: 'Check could not be performed.' },
        configuration: { status: 'error', message: 'Check could not be performed.' },
      },
      metrics: {
        totalDurationMs: parseFloat((performance.now() - startTime).toFixed(2)),
      },
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
    return new Response(superjson.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}