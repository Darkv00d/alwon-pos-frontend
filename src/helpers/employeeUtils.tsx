import { nanoid } from 'nanoid';

/**
 * Generates a secure, random numeric PIN.
 * @param length The desired length of the PIN, between 4 and 6 digits. Defaults to 6.
 * @returns A string representing the generated PIN.
 */
export function generateEmployeePin(length: 4 | 5 | 6 = 6): string {
  if (length < 4 || length > 6) {
    throw new Error("PIN length must be between 4 and 6 digits.");
  }
  // Using crypto for cryptographically secure random numbers
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const max = Math.pow(10, length);
  const randomNumber = buffer[0] % max;
  return randomNumber.toString().padStart(length, '0');
}

type PinValidationResult = {
  isValid: boolean;
  message?: string;
};

/**
 * Validates an employee PIN based on format and common weak patterns.
 * @param pin The PIN string to validate.
 * @returns An object with `isValid` (boolean) and an optional `message` string.
 */
export function validateEmployeePin(pin: string): PinValidationResult {
  if (!/^\d{4,6}$/.test(pin)) {
    return { isValid: false, message: "PIN must be 4 to 6 digits long." };
  }

  // Check for repeating digits (e.g., 1111, 222222)
  if (/^(\d)\1+$/.test(pin)) {
    return { isValid: false, message: "PIN cannot consist of all repeating digits." };
  }

  // Check for sequential digits (e.g., 1234, 9876)
  const isSequential = (p: string) => {
    const digits = p.split('').map(Number);
    let increasing = true;
    let decreasing = true;
    for (let i = 0; i < digits.length - 1; i++) {
      if (digits[i+1] !== digits[i] + 1) increasing = false;
      if (digits[i+1] !== digits[i] - 1) decreasing = false;
    }
    return increasing || decreasing;
  };

  if (isSequential(pin)) {
    return { isValid: false, message: "Sequential PINs are not allowed." };
  }

  return { isValid: true };
}

/**
 * Generates a formatted, likely-unique employee code.
 * NOTE: True uniqueness must be enforced by the backend by checking for collisions.
 * @param prefix The prefix for the code. Defaults to 'EMP'.
 * @returns A new employee code string, e.g., 'EMP-4f7a2'.
 */
export function generateEmployeeCode(prefix: string = 'EMP'): string {
  // nanoid(5) gives ~700k unique IDs before a 1% chance of collision.
  // This is a reasonable balance for human-readable codes.
  const uniquePart = nanoid(5);
  return `${prefix.toUpperCase()}-${uniquePart}`;
}

/**
 * Validates the format of an employee code.
 * Checks for a prefix of 2-4 letters, a hyphen, and an alphanumeric part.
 * @param code The employee code to validate.
 * @returns `true` if the format is valid, `false` otherwise.
 */
export function isValidEmployeeCode(code: string): boolean {
  // Example format: EMP-4f7a2
  const regex = /^[A-Z]{2,4}-[a-zA-Z0-9]+$/;
  return regex.test(code);
}

/**
 * Formats an employee status string for display.
 * @param status The raw status string (e.g., 'active', 'inactive').
 * @returns A capitalized, human-readable status string.
 */
export function getEmployeeStatus(status: string): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Formats an employee's full name from first and last name parts.
 * Trims whitespace and handles cases where one part might be missing.
 * @param firstName The employee's first name.
 * @param lastName The employee's last name.
 * @returns The formatted full name.
 */
export function formatEmployeeName(firstName: string, lastName: string): string {
  const first = firstName?.trim() ?? '';
  const last = lastName?.trim() ?? '';
  return [first, last].filter(Boolean).join(' ');
}