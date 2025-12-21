import {
  startOfDay as dfnsStartOfDay,
  endOfDay as dfnsEndOfDay,
  format as dfnsFormat,
  parseISO as dfnsParseISO,
  isWithinInterval as dfnsIsWithinInterval,
  differenceInMinutes as dfnsDifferenceInMinutes,
  addDays as dfnsAddDays,
  subDays as dfnsSubDays,
  isValid as dfnsIsValid,
  formatDistanceToNow,
} from "date-fns";

/**
 * A collection of date utility functions, primarily wrapping the `date-fns` library
 * to ensure consistent usage across the application. These are essential for handling
 * dates in features like payroll, leave management, and reporting.
 */

type DateInput = Date | number | string;

/**
 * Returns the start of a day for the given date.
 * @param date - The date to get the start of the day for.
 * @returns A new Date object set to the start of the day (00:00:00.000).
 */
export const startOfDay = (date: DateInput): Date => {
  return dfnsStartOfDay(new Date(date));
};

/**
 * Returns the end of a day for the given date.
 * @param date - The date to get the end of the day for.
 * @returns A new Date object set to the end of the day (23:59:59.999).
 */
export const endOfDay = (date: DateInput): Date => {
  return dfnsEndOfDay(new Date(date));
};

/**
 * Formats a date into a string with a specified format.
 * Defaults to 'yyyy-MM-dd'.
 * @param date - The date to format.
 * @param formatStr - The format string (e.g., 'MM/dd/yyyy', 'PPpp').
 * @returns The formatted date string.
 */
export const formatDate = (
  date: DateInput,
  formatStr: string = "yyyy-MM-dd"
): string => {
  const dateObj = new Date(date);
  if (!dfnsIsValid(dateObj)) {
    console.error("Invalid date provided to formatDate:", date);
    return "Invalid Date";
  }
  return dfnsFormat(dateObj, formatStr);
};

/**
 * Parses an ISO-8601 string into a Date object.
 * @param dateString - The ISO date string to parse.
 * @returns A new Date object.
 */
export const parseISO = (dateString: string): Date => {
  return dfnsParseISO(dateString);
};

/**
 * Checks if a date is within a given interval.
 * @param date - The date to check.
 * @param interval - An object with `start` and `end` dates.
 * @returns `true` if the date is within the interval, `false` otherwise.
 */
export const isWithinInterval = (
  date: Date | number,
  interval: { start: Date | number; end: Date | number }
): boolean => {
  return dfnsIsWithinInterval(date, interval);
};

/**
 * Calculates the difference between two dates in whole minutes.
 * @param dateLeft - The first date.
 * @param dateRight - The second date.
 * @returns The number of minutes between the two dates.
 */
export const differenceInMinutes = (
  dateLeft: Date | number,
  dateRight: Date | number
): number => {
  return dfnsDifferenceInMinutes(dateLeft, dateRight);
};

/**
 * Adds a specified number of days to a date.
 * @param date - The date to add days to.
 * @param amount - The number of days to add.
 * @returns A new Date object with the days added.
 */
export const addDays = (date: Date | number, amount: number): Date => {
  return dfnsAddDays(date, amount);
};

/**
 * Subtracts a specified number of days from a date.
 * @param date - The date to subtract days from.
 * @param amount - The number of days to subtract.
 * @returns A new Date object with the days subtracted.
 */
export const subDays = (date: Date | number, amount: number): Date => {
  return dfnsSubDays(date, amount);
};

/**
 * Checks if a given value is a valid Date object.
 * @param date - The value to check.
 * @returns `true` if the value is a valid date, `false` otherwise.
 */
export const isValidDate = (date: any): boolean => {
  return dfnsIsValid(date instanceof Date ? date : new Date(date));
};

/**
 * Formats a duration in minutes into a human-readable string (e.g., "8h 30m").
 * @param totalMinutes - The total number of minutes.
 * @returns A formatted string representing the duration.
 */
export const formatDuration = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes < 0) {
    return "0m";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
};

/**
 * Returns a string representing the time distance from now (e.g., "about 2 hours ago").
 * @param date - The date to compare with the current time.
 * @param options - Optional configuration for formatting.
 * @returns A string representing the relative time.
 */
export const formatRelativeTime = (
  date: DateInput,
  options?: { includeSeconds?: boolean; addSuffix?: boolean }
): string => {
  const dateObj = new Date(date);
  if (!dfnsIsValid(dateObj)) {
    console.error("Invalid date provided to formatRelativeTime:", date);
    return "Invalid Date";
  }
  return formatDistanceToNow(dateObj, options);
};