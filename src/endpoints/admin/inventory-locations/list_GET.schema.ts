import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Locations, LocationTypeArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sortBy: z.enum(['id', 'name', 'code', 'locationType', 'createdAt', 'updatedAt']).optional().default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
  name: z.string().optional(),
  code: z.string().optional(),
  locationType: z.enum(LocationTypeArrayValues).optional(),
  isActive: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  locations: Selectable<Locations>[];
  total: number;
  page: number;
  limit: number;
};

export const getAdminInventoryLocationsList = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();

  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/admin/inventory-locations/list?${searchParams.toString()}`, {
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