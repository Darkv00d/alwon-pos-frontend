import { z } from 'zod';

// No input schema needed for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// Output is a raw CSV string
export type OutputType = string;

export const getCustomersDownloadTemplate = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch('/_api/customers/download-template', {
    method: 'GET',
    ...init,
  });

  if (!result.ok) {
    throw new Error('Failed to download template');
  }

  return result.text();
};