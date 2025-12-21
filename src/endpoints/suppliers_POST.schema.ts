import { z } from "zod";
import superjson from "superjson";
import { type Selectable } from "kysely";
import { type Suppliers, IdTypeArrayValues, PaymentTermsTypeArrayValues } from "../helpers/schema";

export const schema = z.object({
  name: z.string().min(1, "Supplier name is required."),
  contactPerson: z.string().min(1, "Contact person is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Phone number is required."),
  address: z.string().min(1, "Address is required."),
  notes: z.string().optional().nullable(),
  taxId: z.string().min(1, "Tax ID is required."),
  idType: z.enum(IdTypeArrayValues, { required_error: "ID type is required." }),
  paymentTermsType: z.enum(PaymentTermsTypeArrayValues, { required_error: "Payment terms type is required." }),
  creditDays: z.number().min(0, "Credit days must be non-negative.").optional().nullable(),
  leadTimeDays: z.number().min(0, "Lead time days must be non-negative."),
  defaultLocationId: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  // If paymentTermsType is 'CREDITO', creditDays must be provided and > 0
  if (data.paymentTermsType === 'CREDITO') {
    if (data.creditDays === undefined || data.creditDays === null || data.creditDays <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit days are required and must be greater than 0 when payment terms type is 'CREDITO'",
        path: ["creditDays"],
      });
    }
  }
  
  // If paymentTermsType is 'CONTADO', creditDays should be null/undefined
  if (data.paymentTermsType === 'CONTADO') {
    if (data.creditDays !== undefined && data.creditDays !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit days should not be provided when payment terms type is 'CONTADO'",
        path: ["creditDays"],
      });
    }
  }
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  supplier: Selectable<Suppliers>;
};

export const postSuppliers = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/suppliers`, {
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