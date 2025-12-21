import { z } from "zod";

// --- Configuration ---

/**
 * BOLD API endpoint for creating payments.
 */
const BOLD_API_URL = "https://api.bold.co/v1/payments";

/**
 * DUMMY BOLD API Key.
 * IMPORTANT: In a real production environment, this key MUST NOT be stored in the frontend.
 * It should be stored securely as an environment variable on the backend, and all API calls
 * to BOLD should be proxied through a secure backend endpoint.
 */
const BOLD_API_KEY = "dummy_bold_api_key_for_development";

/**
 * DUMMY BOLD Commerce ID.
 * IMPORTANT: Similar to the API key, this should be managed on the backend in production.
 */
const BOLD_COMMERCE_ID = "dummy_bold_commerce_id_for_development";

// --- Type Definitions and Schemas ---

/**
 * Defines the schema for a payment intent. This object contains all the necessary
 * information to initiate a payment transaction with BOLD.
 */
export const PaymentIntentSchema = z.object({
  /**
   * The total amount of the transaction in Colombian Pesos (COP).
   * This value will be converted to cents before sending to the BOLD API.
   */
  amount: z.number().positive("Amount must be a positive number."),
  /**
   * A brief description of the payment, which will appear in the BOLD dashboard.
   */
  description: z.string().min(1, "Description is required."),
  /**
   * A unique identifier for the order from the Alwon POS system.
   * This is crucial for reconciliation.
   */
  orderId: z.string().min(1, "Order ID is required."),
  /**
   * Optional customer information.
   */
  customer: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Invalid email format.").optional(),
    })
    .optional(),
  /**
   * Optional metadata for storing additional information about the transaction.
   * Can be used to store POS-specific data like `locationId` or `cashierId`.
   */
  metadata: z.record(z.string(), z.any()).optional(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

/**
 * Represents the result of a payment transaction from BOLD.
 * This can be either a success or an error.
 */
export type PaymentResult =
  | {
      success: true;
      transactionId: string;
      status: string;
      authorizationCode?: string;
      errorMessage?: string;
    }
  | {
      success: false;
      transactionId: string;
      status: string;
      errorMessage: string;
    };

// --- Core Function ---

/**
 * Processes a card payment by sending a payment intent to the BOLD API.
 *
 * NOTE: This function is designed as a client-side helper for integration purposes.
 * In a production environment, for security reasons (to protect API keys), this logic
 * should be moved to a secure backend endpoint. The frontend would then call this
 * backend endpoint instead of the BOLD API directly.
 *
 * @param intent - The payment intent object containing transaction details.
 * @returns A promise that resolves to a `PaymentResult` object.
 */
export const processCardPayment = async (
  intent: PaymentIntent,
): Promise<PaymentResult> => {
  console.log("Processing payment for order:", intent.orderId);

  try {
    // 1. Validate the input using Zod schema
    const validationResult = PaymentIntentSchema.safeParse(intent);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message || "Invalid payment intent.";
      console.error("Payment intent validation failed:", validationResult.error.flatten());
      return {
        success: false,
        transactionId: "",
        status: "failed",
        errorMessage: `Validation Error: ${errorMessage}`,
      };
    }

    const { amount, description, orderId, customer, metadata } = validationResult.data;

    // 2. Prepare the request body for BOLD API
    // BOLD requires the amount in cents, so we multiply by 100 and round to the nearest integer.
    const amountInCents = Math.round(amount * 100);

    const requestBody = {
      amount: amountInCents,
      currency: "COP", // Hardcoded for Colombian market
      description,
      order_id: orderId,
      customer: customer
        ? { name: customer.name, email: customer.email }
        : undefined,
      metadata: metadata || {},
    };

    console.log("Sending request to BOLD API:", {
      url: BOLD_API_URL,
      body: requestBody,
    });

    // 3. Make the API call to BOLD
    const response = await fetch(BOLD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOLD_API_KEY}`,
        "X-Commerce-ID": BOLD_COMMERCE_ID,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("BOLD payment error:", error);
      return {
        success: false,
        transactionId: "",
        status: "rejected",
        errorMessage: error.message || "Payment failed",
      };
    }

    const result = await response.json();

    return {
      success: result.status === "approved",
      transactionId: result.id.toString(),
      status: result.status,
      authorizationCode: result.authorization_code,
      errorMessage: result.status !== "approved" 
        ? result.status_detail 
        : undefined,
    };
  } catch (error) {
    console.error("Payment gateway error:", error);
    return {
      success: false,
      transactionId: "",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
};