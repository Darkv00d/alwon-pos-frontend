import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { DB } from "../../helpers/schema";

// No input schema needed for a GET request
export const schema = z.object({});

export type Module = Selectable<DB['modules']>;

export type RoleWithPermissions = {
  id: number;
  name: string;
  permissions: {
    moduleCode: string;
    canRead: boolean;
    canWrite: boolean;
  }[];
};

export type OutputType = {
  modules: Module[];
  roles: RoleWithPermissions[];
};

export const getAdminModulesList = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/modules-list`, {
    method: "GET",
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