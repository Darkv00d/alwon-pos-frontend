/**
 * Formats a number as a currency string in Colombian Pesos (COP).
 *
 * @param value - The number to format.
 * @param maximumFractionDigits - The maximum number of decimal places. Defaults to 0 for COP.
 * @returns A formatted currency string (e.g., "$ 1.234.567").
 */
export const formatCurrency = (value: number, maximumFractionDigits: number = 0): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits,
  }).format(value);
};