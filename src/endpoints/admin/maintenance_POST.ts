import { schema, OutputType, InputType } from "./maintenance_POST.schema";
import superjson from 'superjson';

interface ValidationOrMigrationResult {
  success: boolean;
}
import { verifyAdminToken } from "../../helpers/auth";
import { seedAllData } from "../../helpers/seedData";
import { runAllValidations } from "../../helpers/dataValidation";
import { runPerformanceExamples } from "../../helpers/performanceUtils";
import { migrateStockQuantities, migrateDefaultLocationForPOs } from "../../helpers/migrationUtils";

async function handleOperation(operation: InputType['operation'], parameters: InputType['parameters']) {
  let logs: string[] = [];
  let details: any = null;

  switch (operation) {
    case 'seed':
      logs.push("Starting database seed operation...");
      details = await seedAllData();
      logs.push(details.message);
      return { success: details.success, logs, details };

    case 'validate':
      logs.push("Starting data validation checks...");
      details = await runAllValidations();
      const failedChecks = details.filter((r: ValidationOrMigrationResult) => !r.success);
      if (failedChecks.length > 0) {
        logs.push(`Validation finished with ${failedChecks.length} failed checks.`);
        return { success: false, logs, details };
      }
      logs.push("All data validation checks passed successfully.");
      return { success: true, logs, details };

    case 'performance':
      logs.push("Running performance examples...");
      // Note: This function logs to the console, which won't be captured here.
      // The purpose is for developers to check server logs.
      // We can return a message indicating this.
      await runPerformanceExamples();
      logs.push("Performance examples executed. Check server logs for detailed query plans and execution times.");
      details = { message: "Check server logs for output." };
      return { success: true, logs, details };

    case 'migrate':
      logs.push("Starting data migration operation...");
      // In a real scenario, you might take a 'migrationName' from parameters
      // For this example, we'll run the available migrations.
      const migrationResults = await Promise.all([
        migrateStockQuantities(),
        migrateDefaultLocationForPOs()
      ]);
      details = migrationResults;
      const failedMigrations = migrationResults.filter((r: ValidationOrMigrationResult) => !r.success);
      if (failedMigrations.length > 0) {
        logs.push(`Migration finished with ${failedMigrations.length} failed operations.`);
        return { success: false, logs, details };
      }
      logs.push("All data migrations completed successfully.");
      return { success: true, logs, details };

    default:
      return { success: false, logs: [`Unknown operation: ${operation}`], details: null };
  }
}

export async function handle(request: Request) {
  const startTime = performance.now();

  const adminUser = await verifyAdminToken(request);
  if (!adminUser) {
    return new Response(superjson.stringify({ error: "Unauthorized: Admin access required." }), { status: 401 });
  }

  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    console.log(`Admin Maintenance: User ${adminUser.email} triggered operation '${input.operation}'.`);

    const { success, logs, details } = await handleOperation(input.operation, input.parameters);
    
    const duration = performance.now() - startTime;

    const output: OutputType = {
      success,
      logs,
      duration,
      details,
    };

    return new Response(superjson.stringify(output), {
      status: success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in admin maintenance endpoint:", error);
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    
    const output: OutputType = {
      success: false,
      logs: ["An unexpected error occurred.", errorMessage],
      duration,
      details: error,
    };

    return new Response(superjson.stringify(output), { status: 500 });
  }
}