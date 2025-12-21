import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Suppliers, IdTypeArrayValues, PaymentTermsTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  id: z.number(),
  name: z.string().min(1, "Supplier name is required.").optional(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Invalid email address.").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  idType: z.enum(IdTypeArrayValues).optional().nullable(),
  paymentTermsType: z.enum(PaymentTermsTypeArrayValues).optional().nullable(),
  creditDays: z.number().min(0, "Credit days must be non-negative.").optional().nullable(),
  leadTimeDays: z.number().min(0, "Lead time days must be non-negative.").optional().nullable(),
  defaultLocationId: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  // If creditDays is provided, paymentTermsType must be 'CREDITO'
  if (data.creditDays !== undefined && data.creditDays !== null) {
    return data.paymentTermsType === 'CREDITO';
  }
  return true;
}, {
  message: "Credit days can only be specified when payment terms type is 'CREDITO'",
  path: ["creditDays"],
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  supplier: Selectable<Suppliers>;
};

export const postSuppliersUpdate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/suppliers/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};