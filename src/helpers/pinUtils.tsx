/**
 * Generates a random 4-digit PIN as a string.
 * Ensures the PIN is exactly 4 digits by padding with a leading zero if necessary.
 * @returns A 4-digit string (e.g., "1234", "0876").
 */
export const generateRandomPIN = (): string => {
  const pin = Math.floor(Math.random() * 10000);
  return pin.toString().padStart(4, '0');
};

/**
 * Validates if a given string is a valid 4-digit PIN.
 * @param pin The string to validate.
 * @returns `true` if the string contains exactly 4 digits, `false` otherwise.
 */
export const validatePIN = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};