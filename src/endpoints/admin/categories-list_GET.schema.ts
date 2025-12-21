import superjson from 'superjson';
import { z } from 'zod';
import { type Categories, type Subcategories } from '../../helpers/schema';
import { type Selectable } from 'kysely';

// No input schema needed for a GET request
export const schema = z.object({});

export type CategoryWithSubcategories = Selectable<Categories> & {
  subcategories: Selectable<Subcategories>[];
};

export type OutputType = {
  categories: CategoryWithSubcategories[];
};

export const getAdminCategoriesList = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/categories-list`, {
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