import { z } from "zod";

/**
 * Defines the Zod schema for POS Location data.
 * This schema is intended for frontend use (e.g., forms) and can be imported
 * into endpoint schemas to ensure consistency between client and server validation.
 * It does not contain any backend-specific dependencies.
 */
export const posLocationSchema = z.object({
  // The ID is optional, as it won't exist when creating a new location.
  id: z.number().optional(),
  // The location's display name. Must be a non-empty string.
  name: z.string().min(1, { message: "Name is required." }),
  // A unique code for the location. If provided, must be a non-empty string.
  code: z.string().min(1, { message: "Code cannot be empty." }).nullable().optional(),
  // The physical address of the location. Can be optional or null.
  address: z.string().nullable().optional(),
  // The status of the location. Defaults to active (true).
  isActive: z.boolean().default(true),
});

/**
 * The TypeScript type inferred from the schema, representing the data structure
 * for a form when creating or updating a POS location. The `id` is optional.
 */
export type PosLocationInput = z.infer<typeof posLocationSchema>;

/**
 * A stricter version of the schema where the `id` is required.
 * This is useful for representing location data that has already been
 * saved to the database and is guaranteed to have an ID.
 */
const posLocationOutputSchema = posLocationSchema.extend({
  id: z.number(),
});

/**
 * The TypeScript type for a POS location that has been persisted.
 * This type is equivalent to `PosLocationInput` but with a required `id`.
 */
export type PosLocation = z.infer<typeof posLocationOutputSchema>;