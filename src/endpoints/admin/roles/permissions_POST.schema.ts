import { z } from "zod";
import superjson from 'superjson';

const modulePermissionSchema = z.object({
  code: z.string().min(1, "Module code cannot be empty."),
  canRead: z.boolean().optional().default(true),
  canWrite: z.boolean().optional().default(false),
});

export const schema = z.object({
  roleName: z.string().min(1, "Role name is required."),
  modules: z.array(modulePermissionSchema).min(1, "At least one module permission is required."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: true;
  roleId: number;
};

export const postSetRolePermissions = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/roles/permissions`, {
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