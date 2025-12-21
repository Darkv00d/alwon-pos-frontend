import { toast } from "sonner";

/**
 * Detects the most likely delimiter in a CSV string by analyzing frequency patterns.
 * @param csvString The raw CSV content as a string.
 * @returns The detected delimiter character.
 */
export const detectDelimiter = (csvString: string): string => {
  const delimiters = [',', ';', '\t'];
  const lines = csvString.split(/\r\n|\n|\r/).slice(0, 5); // Analyze first 5 lines
  
  let bestDelimiter = ',';
  let maxScore = -1;
  
  for (const delimiter of delimiters) {
    let score = 0;
    let fieldCounts: number[] = [];
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      try {
        const fields = splitCSVRow(line, delimiter);
        fieldCounts.push(fields.length);
      } catch {
        // If parsing fails with this delimiter, skip
        continue;
      }
    }
    
    if (fieldCounts.length === 0) continue;
    
    // Check consistency - all rows should have same field count
    const firstCount = fieldCounts[0];
    const isConsistent = fieldCounts.every(count => count === firstCount);
    
    if (isConsistent && firstCount > 1) {
      score = firstCount * fieldCounts.length;
      
      if (score > maxScore) {
        maxScore = score;
        bestDelimiter = delimiter;
      }
    }
  }
  
  return bestDelimiter;
};

/**
 * Splits a single CSV row into fields using a state machine to handle quoted fields properly.
 * @param row The CSV row string to split.
 * @param delimiter The delimiter character to use.
 * @returns Array of field values.
 */
export const splitCSVRow = (row: string, delimiter: string): string[] => {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < row.length) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (char === '"') {
      if (inQuotes) {
        // Check for escaped quote (double quote)
        if (nextChar === '"') {
          currentField += '"';
          i += 2; // Skip both quotes
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        // Start of quoted field
        inQuotes = true;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator found outside quotes
      fields.push(currentField.trim());
      currentField = '';
    } else {
      // Regular character
      currentField += char;
    }
    
    i++;
  }
  
  // Add the last field
  fields.push(currentField.trim());
  
  return fields;
};

/**
 * Validates the structure of a CSV string against expected headers using robust parsing.
 *
 * @param csvString The raw CSV content as a string.
 * @param expectedHeaders An array of strings representing the required header columns.
 * @param delimiter Optional delimiter. If not provided, auto-detection will be used.
 * @returns An object with `isValid` (boolean) and an optional `message` (string) if invalid.
 */
export const validateCSVStructure = (
  csvString: string,
  expectedHeaders: string[],
  delimiter?: string
): { isValid: boolean; message?: string } => {
  if (!csvString || typeof csvString !== "string") {
    return { isValid: false, message: "CSV content is empty or invalid." };
  }

  // Normalize line breaks and split
  const normalizedCSV = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedCSV.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 1) {
    return { isValid: false, message: "CSV file is empty." };
  }

  // Auto-detect delimiter if not provided
  const actualDelimiter = delimiter || detectDelimiter(csvString);

  let headers: string[];
  try {
    headers = splitCSVRow(lines[0], actualDelimiter);
  } catch (error) {
    return { isValid: false, message: "Failed to parse CSV headers." };
  }

  if (headers.length !== expectedHeaders.length) {
    return {
      isValid: false,
      message: `Invalid column count. Expected ${expectedHeaders.length} columns, but found ${headers.length}.`,
    };
  }

  const missingHeaders = expectedHeaders.filter(
    (expectedHeader) => !headers.includes(expectedHeader)
  );

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      message: `Missing required columns: ${missingHeaders.join(", ")}.`,
    };
  }

  // Validate all data rows have consistent column count
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    
    try {
      const fields = splitCSVRow(line, actualDelimiter);
      if (fields.length !== headers.length) {
        return {
          isValid: false,
          message: `Row ${
            i + 1
          } has an incorrect number of columns. Expected ${
            headers.length
          }, but found ${fields.length}.`,
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Row ${i + 1} has invalid CSV format.`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Parses a CSV string into an array of objects using robust parsing logic.
 * Handles quoted fields, escaped quotes, and different line break formats.
 *
 * @param csvString The raw CSV content as a string.
 * @param delimiter Optional delimiter. If not provided, auto-detection will be used.
 * @returns An array of objects, where each object represents a row.
 */
export const parseCSV = (
  csvString: string,
  delimiter?: string
): Record<string, string>[] => {
  if (!csvString || typeof csvString !== "string") {
    return [];
  }

  // Normalize line breaks
  const normalizedCSV = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedCSV.split('\n');
  
  if (lines.length < 2) {
    return []; // Not enough data for headers and rows
  }

  // Auto-detect delimiter if not provided
  const actualDelimiter = delimiter || detectDelimiter(csvString);

  let headers: string[];
  try {
    headers = splitCSVRow(lines[0], actualDelimiter);
  } catch (error) {
    console.warn("Failed to parse CSV headers:", error);
    return [];
  }

  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;

    let values: string[];
    try {
      values = splitCSVRow(line, actualDelimiter);
    } catch (error) {
      console.warn(
        `Skipping row ${i + 1}: parsing error.`,
        error
      );
      continue;
    }

    if (values.length !== headers.length) {
      console.warn(
        `Skipping row ${i + 1}: column count mismatch. Expected ${
          headers.length
        }, got ${values.length}.`
      );
      continue;
    }

    const entry = headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {} as Record<string, string>);

    data.push(entry);
  }

  return data;
};

/**
 * Generates and triggers the download of a CSV template file.
 *
 * @param headers An array of strings to be used as the CSV header row.
 * @param filename The desired name for the downloaded file. Defaults to 'template.csv'.
 */
export const downloadTemplate = (
  headers: string[],
  filename: string = "template.csv"
) => {
  if (!headers || headers.length === 0) {
    toast.error("Cannot generate a template with no headers.");
    return;
  }

  const headerString = headers.join(",");
  const blob = new Blob([headerString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    toast.error("Your browser does not support automatic file downloads.");
  }
};