import { z } from 'zod';
import { IdTypeArrayValues } from './schema';

// Zod schema for a single customer row from the CSV
// This is more lenient with types as CSV values are strings
const CustomerRowSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email format.").optional().or(z.literal('')),
  idType: z.enum(IdTypeArrayValues, { errorMap: () => ({ message: `ID Type must be one of: ${IdTypeArrayValues.join(', ')}` }) }),
  idNumber: z.string().min(5, "ID Number must be at least 5 characters."),
  mobile: z.string().min(7, "Mobile number must be at least 7 characters.").optional().or(z.literal('')),
  locationId: z.coerce.number({ invalid_type_error: "Location ID must be a number." }).int().positive("Location ID must be a positive number."),
  apartment: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
}).refine(data => data.email || data.mobile, {
  message: "Either Email or Mobile must be provided.",
  path: ["email"], // you can point to one of the fields
});

export type CsvCustomer = z.infer<typeof CustomerRowSchema>;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: Record<string, string>;
}

/**
 * Validates a single row of customer data from a CSV file.
 * @param row - The customer data object for a single row.
 * @param existingEmails - A Set of emails that already exist in the system or previous rows.
 * @param existingMobiles - A Set of mobile numbers that already exist.
 * @param existingIdNumbers - A Set of ID numbers that already exist.
 * @returns A ValidationResult object with validity status and a list of errors.
 */
export const validateCustomerRow = (
  row: Record<string, string>,
  existingEmails: Set<string>,
  existingMobiles: Set<string>,
  existingIdNumbers: Set<string>
): ValidationResult => {
  const result = CustomerRowSchema.safeParse(row);

  if (!result.success) {
    const errors = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return { isValid: false, errors, data: row };
  }

  const errors: string[] = [];
  const { email, mobile, idNumber, birthDate } = result.data;

  // Uniqueness checks
  if (email) {
    if (existingEmails.has(email)) {
      errors.push("Email already exists.");
    }
    existingEmails.add(email);
  }

  if (mobile) {
    if (existingMobiles.has(mobile)) {
      errors.push("Mobile number already exists.");
    }
    existingMobiles.add(mobile);
  }

  if (idNumber) {
    if (existingIdNumbers.has(idNumber)) {
      errors.push("ID Number already exists.");
    }
    existingIdNumbers.add(idNumber);
  }

  // Date format check
  if (birthDate) {
    const parsedDate = new Date(birthDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Birth date is not a valid date. Use YYYY-MM-DD format.");
    } else if (parsedDate > new Date()) {
      errors.push("Birth date cannot be in the future.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: row,
  };
};