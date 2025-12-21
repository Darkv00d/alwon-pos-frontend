import { z } from 'zod';
import superjson from 'superjson';
import { IdTypeArrayValues } from '../../helpers/schema';

const CustomerImportSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable(),
  idType: z.enum(IdTypeArrayValues),
  idNumber: z.string().min(1),
  mobile: z.string().nullable(),
  locationId: z.number().int().positive(),
  apartment: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
}).refine(data => data.email || data.mobile, {
  message: "Either email or mobile must be provided.",
});

export const schema = z.object({
  customers: z.array(CustomerImportSchema),
  generatePin: z.boolean().default(true),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  imported: number;
  failed: number;
  customers: {
    customerNumber: string;
    name: string;
    pin: string | null;
  }[];
};

export const postCustomersBulkImport = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch('/_api/customers/bulk-import', {
    method: 'POST',
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};