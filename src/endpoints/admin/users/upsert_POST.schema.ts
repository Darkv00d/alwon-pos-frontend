import { z } from "zod";
import superjson from 'superjson';
import { IdentificationType } from "../../../helpers/User";

const identificationTypeValues: [IdentificationType, ...IdentificationType[]] = ["CC", "CE", "NIT", "PAS", "OTRO"];

export const baseUpsertUserSchema = z.object({
  uuid: z.string().uuid("Invalid UUID format.").optional(),
  email: z.string().email("Invalid email address."),
  fullName: z.string().min(1, "Full name is required.").optional().nullable(),
  displayName: z.string().optional().nullable(),
  avatarUrl: z.string().url("Invalid URL format.").optional().nullable(),
  isActive: z.boolean().default(true),
  // Password is optional for updates, but required for creates.
  // This is enforced in the handler logic and schema refinement.
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  roleNames: z.array(z.string().min(1, "Role name cannot be empty.")).min(1, "At least one role is required."),
  identificationType: z.enum(identificationTypeValues).optional(),
  identificationNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  status: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
});

export const schema = baseUpsertUserSchema.refine(data => data.uuid || data.password, {
  message: "Password is required when creating a new user.",
  path: ["password"], // Point error to the password field
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: true;
  userUuid: string;
};

export const postUpsertUser = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/users/upsert`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string; details?: any }>(await result.text());
    throw new Error(errorObject.error);
  }
  
  return superjson.parse<OutputType>(await result.text());
};