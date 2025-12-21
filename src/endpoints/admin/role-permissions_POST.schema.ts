import { z } from "zod";
import superjson from 'superjson';

const modulePermissionSchema = z.object({
  moduleCode: z.string().min(1, "Module code is required."),
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

export const schema = z.object({
  roleName: z.string().min(1, "Role name is required."),
  permissions: z.array(modulePermissionSchema),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postAdminRolePermissions = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/role-permissions`, {
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