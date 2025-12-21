import { z } from "zod";

/**
 * Defines the schema for the application's configuration.
 * This ensures that all configuration values are of the correct type and format.
 * Schema is flexible to support both environment variables (backend) and hardcoded values (frontend).
 */
const AppConfigSchema = z.object({
  /**
   * The name of the company.
   */
  companyName: z.string().min(1),
  /**
   * The currency code used throughout the application.
   * Defaults to Colombian Peso (COP) but can be overridden via CURRENCY env var.
   */
  currency: z.string().min(1),
  /**
   * The locale for formatting dates, numbers, and currency.
   * Defaults to Spanish (Colombia) but can be overridden via LOCALE env var.
   */
  locale: z.string().min(1),
  /**
   * The timezone for the application.
   * Defaults to Bogota, Colombia but can be overridden via TIMEZONE env var.
   */
  timezone: z.string().min(1),
  /**
   * The tax rate as a decimal value.
   * Defaults to 19% (0.19) for Colombian IVA but can be overridden via TAX_RATE env var.
   */
  taxRate: z.number().min(0).max(1),
});

/**
 * Type representing the application configuration, inferred from the Zod schema.
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Safely detects if we're running in a backend environment where process.env is available.
 * Returns true if we can access environment variables, false otherwise (frontend).
 */
function isBackendEnvironment(): boolean {
  try {
    return typeof process !== 'undefined' && 
           typeof process.env !== 'undefined' && 
           process.env !== null;
  } catch {
    return false;
  }
}

/**
 * Retrieves configuration values with backend/frontend adaptive behavior:
 * - Backend: Uses environment variables when available, falls back to defaults
 * - Frontend: Uses hardcoded default values (process.env not available)
 * 
 * Environment variables supported:
 * - COMPANY_NAME: Company name (default: "Alwon")
 * - CURRENCY: Currency code (default: "COP") 
 * - LOCALE: Locale string (default: "es-CO")
 * - TIMEZONE: Timezone string (default: "America/Bogota")
 * - TAX_RATE: Tax rate as decimal string (default: "0.19")
 */
function getConfigValues(): AppConfig {
  const defaults = {
    companyName: "Alwon",
    currency: "COP",
    locale: "es-CO",
    timezone: "America/Bogota",
    taxRate: 0.19, // Standard IVA rate in Colombia (19%)
  };

  // If we're not in a backend environment, return defaults immediately
  if (!isBackendEnvironment()) {
    console.log('Frontend environment detected, using default configuration values');
    return defaults;
  }

  // Backend environment - try to use environment variables
  try {
    const envTaxRate = process.env.TAX_RATE ? parseFloat(process.env.TAX_RATE) : defaults.taxRate;
    
    const envConfig = {
      companyName: process.env.COMPANY_NAME || defaults.companyName,
      currency: process.env.CURRENCY || defaults.currency,
      locale: process.env.LOCALE || defaults.locale,
      timezone: process.env.TIMEZONE || defaults.timezone,
      taxRate: isNaN(envTaxRate) ? defaults.taxRate : envTaxRate,
    };

    console.log('Backend environment detected, using environment variables with defaults as fallback');
    return envConfig;
  } catch (error) {
    console.warn('Failed to read environment variables, falling back to defaults:', error);
    return defaults;
  }
}

// Get configuration values with environment variable support
const rawConfig = getConfigValues();

// Validate the configuration object against the schema.
// This will throw an error during development if the configuration is invalid.
const validatedConfig = AppConfigSchema.parse(rawConfig);

/**
 * An immutable, validated configuration object for the application.
 * This object centralizes all localization, currency, and tax settings.
 * 
 * **Dual Environment Support:**
 * - **Backend**: Dynamically reads from environment variables with fallbacks to defaults
 * - **Frontend**: Uses safe hardcoded default values (process.env not available)
 * 
 * **Environment Variables (Backend only):**
 * - `COMPANY_NAME`: Override company name (default: "Alwon")
 * - `CURRENCY`: Override currency code (default: "COP")
 * - `LOCALE`: Override locale (default: "es-CO")
 * - `TIMEZONE`: Override timezone (default: "America/Bogota")
 * - `TAX_RATE`: Override tax rate as decimal string (default: "0.19")
 *
 * @example
 * import { appConfig } from "../helpers/config";
 *
 * // Works in both backend and frontend
 * const tax = amount * appConfig.taxRate;
 * const formattedPrice = new Intl.NumberFormat(appConfig.locale, {
 *   style: 'currency',
 *   currency: appConfig.currency,
 * }).format(price);
 * 
 * @example
 * // Backend endpoint example - will use environment variables if set
 * export async function handle(request: Request) {
 *   const invoice = {
 *     company: appConfig.companyName,
 *     total: amount * (1 + appConfig.taxRate),
 *     currency: appConfig.currency
 *   };
 *   return Response.json(invoice);
 * }
 */
export const appConfig = Object.freeze(validatedConfig);