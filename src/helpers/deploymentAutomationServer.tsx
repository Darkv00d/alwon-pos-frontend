import { runAllValidations } from "./dataValidation";
import type { MaintenanceTaskOutput } from "./deploymentAutomationModels";

/**
 * Represents the result of a single validation check, consistent with dataValidation helper.
 * This type aligns with the ValidationResult returned by dataValidation functions.
 */
type ValidationResult = {
  checkName: string;
  success: boolean;
  message: string;
  details?: unknown[];
};

/**
 * Represents the comprehensive result of the entire pre-deployment check process.
 * This extends the MaintenanceTaskOutput model to maintain backward compatibility.
 */
export type DeploymentCheckResult = {
  overallSuccess: boolean;
  message: string;
  checkResults: ValidationResult[];
};

/**
 * Executes a series of pre-deployment data integrity checks against the database.
 * This function is designed to be called exclusively from server-side endpoints
 * as part of an automated deployment or maintenance workflow.
 *
 * It aggregates results from the `dataValidation` helper and provides a clear,
 * structured summary of the database's health.
 *
 * @returns {Promise<DeploymentCheckResult>} An object containing the overall status and detailed results of all checks.
 */
export async function runPreDeploymentChecks(): Promise<DeploymentCheckResult> {
  console.log("[Deployment Automation] Starting pre-deployment database checks...");

  try {
    const results = await runAllValidations();
    const allChecksPassed = results.every((result) => result.success);

    const summaryMessage = allChecksPassed
      ? "All pre-deployment checks passed successfully."
      : "One or more pre-deployment checks failed. Review details.";

    console.log(`[Deployment Automation] Pre-deployment checks finished. Overall success: ${allChecksPassed}`);

    return {
      overallSuccess: allChecksPassed,
      message: summaryMessage,
      checkResults: results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the check process.";
    console.error("[Deployment Automation] A critical error occurred while running pre-deployment checks:", error);
    
    return {
      overallSuccess: false,
      message: `Critical failure during check execution: ${errorMessage}`,
      checkResults: [],
    };
  }
}