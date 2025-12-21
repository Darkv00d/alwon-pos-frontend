import { getHealth, type OutputType as HealthOutputType } from "../endpoints/health_GET.schema";
import { postAdminPreDeployChecks } from "../endpoints/admin/pre-deploy-checks_POST.schema";
import { formatDate } from "./dateUtils";
import type { 
  DeploymentStatus as BaseDeploymentStatus,
  LogEntry as BaseLogEntry,
  DeploymentStep as BaseDeploymentStep,
  DeploymentCheckResult,
  ValidationResult
} from "./deploymentAutomationModels";

/**
 * Represents the status of a single step in the deployment checklist.
 * Extends the base DeploymentStatus to include additional client-specific states.
 * - pending: The step has not started.
 * - running: The step is currently in progress.
 * - success: The step completed successfully.
 * - failure: The step failed.
 * - warning: The step completed but with non-critical issues.
 * - skipped: The step was skipped.
 */
export type DeploymentStepStatus = BaseDeploymentStatus | 'skipped';

/**
 * Defines the structure for a single item in the deployment checklist.
 * Extends the base DeploymentStep to maintain client compatibility.
 */
export interface DeploymentStep extends Omit<BaseDeploymentStep, 'status'> {
  status: DeploymentStepStatus;
  result?: string; // Optional message to display after completion - kept for backward compatibility
}

/**
 * Represents the standardized result of a pre-deployment or post-deployment check.
 * Compatible with DeploymentCheckResult and ValidationResult from the models.
 */
export interface CheckResult {
  success: boolean;
  message: string;
  details?: unknown; // Can hold detailed logs, error objects, etc.
}

/**
 * Defines the structure for a log entry to be displayed in the UI.
 * Extends the base LogEntry to include additional log levels.
 */
export interface LogEntry extends Omit<BaseLogEntry, 'level'> {
  level: BaseLogEntry['level'] | 'success' | 'debug';
}

/**
 * Generates the static checklist of deployment steps.
 * This function provides the initial state for the deployment UI.
 * @returns An array of DeploymentStep objects.
 */
export const generateDeploymentChecklist = (): DeploymentStep[] => {
  return [
    {
      id: 'pre-deployment',
      title: '1. Pre-Deployment Checks',
      description: 'Run automated checks to ensure data integrity and system readiness before publishing.',
      status: 'pending',
    },
    {
      id: 'publish',
      title: '2. Publish to Production',
      description: 'Manually trigger the new build from the Floot dashboard. This step is not automated.',
      status: 'pending',
    },
    {
      id: 'post-deployment',
      title: '3. Post-Deployment Verification',
      description: 'Run health checks on the newly deployed version to confirm everything is working correctly.',
      status: 'pending',
    },
  ];
};

/**
 * Triggers the pre-deployment checks by calling the relevant backend endpoint.
 * @returns A promise that resolves to a CheckResult object.
 */
export const triggerPreDeploymentChecks = async (): Promise<CheckResult> => {
  try {
    console.log("Triggering pre-deployment checks via admin endpoint");
    
    const results = await postAdminPreDeployChecks({});
    
    // Map the DeploymentCheckResult to CheckResult to maintain interface compatibility
    return {
      success: results.overallSuccess,
      message: results.message,
      details: results.checkResults,
    };
  } catch (error) {
    console.error("Error during pre-deployment checks:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during pre-deployment checks.";
    
    return {
      success: false,
      message: `Failed to execute pre-deployment checks: ${errorMessage}`,
      details: error,
    };
  }
};

/**
 * Runs post-deployment verification by calling the public health check endpoint.
 * This performs a "deep" scan to ensure all systems are operational.
 * @returns A promise that resolves to a CheckResult object.
 */
export const runPostDeploymentVerification = async (): Promise<CheckResult> => {
  try {
    const healthData: HealthOutputType = await getHealth({ deep: true });

    if (healthData.status === 'ok') {
      // Even if overall status is 'ok', we check individual components for robustness.
      const failedChecks = Object.entries(healthData.checks)
        .filter(([key, check]) => {
          if (!check) return false;
          
          // Handle dataValidation array separately
          if (key === 'dataValidation' && Array.isArray(check)) {
            return check.some(validation => !validation.success);
          }
          
          // Handle other checks that have status property
          return 'status' in check && check.status === 'error';
        });
      
      if (failedChecks.length > 0) {
        return {
          success: false,
          message: `Post-deployment verification failed. ${failedChecks.length} check(s) reported errors.`,
          details: healthData,
        };
      }

      return {
        success: true,
        message: 'System health verified. All services are operational.',
        details: healthData,
      };
    } else {
      return {
        success: false,
        message: `System health check failed with status: ${healthData.status}.`,
        details: healthData,
      };
    }
  } catch (error) {
    console.error("Error during post-deployment verification:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Failed to execute health check: ${errorMessage}`,
      details: error,
    };
  }
};

/**
 * A utility function to create a formatted log entry for the UI.
 * @param message - The log message content.
 * @param level - The severity level of the log ('info', 'error', 'warn').
 * @returns A LogEntry object with a formatted timestamp.
 */
export const createLogEntry = (message: string, level: LogEntry['level']): LogEntry => {
  return {
    timestamp: formatDate(new Date(), 'HH:mm:ss'),
    message,
    level,
  };
};