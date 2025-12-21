/**
 * This helper file defines shared TypeScript types and interfaces for the deployment
 * automation process. It is designed to be a single source of truth for data models
 * used by both the frontend (e.g., the deployment page) and the backend (e.g., maintenance endpoints).
 *
 * IMPORTANT: This file must not contain any functions, logic, or imports from other
 * helpers or libraries. Its sole purpose is to define types, ensuring it can be
 * safely imported anywhere without creating circular dependencies.
 */

/**
 * Represents the status of a deployment step or a specific check.
 * - pending: The task has not yet started.
 * - running: The task is currently in progress.
 * - success: The task completed successfully.
 * - failure: The task failed.
 * - warning: The task completed but with non-critical issues.
 */
export type DeploymentStatus =
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "warning";

/**
 * Represents a single log entry generated during the deployment process.
 * Used to display real-time activity in the UI.
 */
export interface LogEntry {
  timestamp: string; // ISO 8601 string format for easy serialization
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown> | string;
}

/**
 * Represents the result of a specific data integrity validation check.
 * These are typically part of a larger pre-deployment or post-deployment check.
 */
export interface ValidationResult {
  validatorName: string;
  status: "success" | "failure";
  message: string;
  // Optional array of specific error details, e.g., IDs of invalid records.
  errors?: string[];
}

/**
 * Represents the result of a single check performed during a deployment step.
 * This is a more generic version of ValidationResult.
 */
export interface DeploymentCheckResult {
  name: string;
  status: "success" | "failure" | "warning";
  message: string;
  // Optional field for more detailed, structured information.
  details?: unknown;
}

/**
 * Represents a single, distinct step in the deployment checklist.
 * This is the primary model for rendering the checklist UI.
 */
export interface DeploymentStep {
  id: string; // A unique identifier, e.g., 'pre-deployment-checks'
  title: string;
  description: string;
  status: DeploymentStatus;
  // Optional field to store the detailed results of the checks run in this step.
  results?: (DeploymentCheckResult | ValidationResult)[];
}

/**
 * Represents the overall state of the deployment checklist, which is a collection
 * of individual deployment steps.
 */
export type DeploymentChecklist = DeploymentStep[];

/**
 * Defines the structure of the output from a maintenance task endpoint,
 * such as running pre-deployment checks or post-deployment health verifications.
 */
export interface MaintenanceTaskOutput {
  success: boolean;
  message: string;
  logs: LogEntry[];
  results?: (DeploymentCheckResult | ValidationResult)[];
}