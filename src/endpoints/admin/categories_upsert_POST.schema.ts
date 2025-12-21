import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Categories, type Subcategories } from "../../helpers/schema";

export type Category = Selectable<Categories>;
export type Subcategory = Selectable<Subcategories>;

export const schema = z.object({
  categoryName: z.string().min(1, "Category name is required."),
  subcategoryName: z.string().min(1, "Subcategory name must not be empty.").optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  category: Category;
  subcategory?: Subcategory;
};

export const postAdminCategoriesUpsert = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/categories_upsert`, {
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