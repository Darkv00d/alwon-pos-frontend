import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Holidays } from "../helpers/schema";

const addSchema = z.object({
  action: z.literal('add'),
  payload: z.object({
    name: z.string().min(1),
    date: z.date(),
  }),
});

const deleteSchema = z.object({
  action: z.literal('delete'),
  payload: z.object({
    name: z.string().min(1),
    date: z.date(),
  }),
});

export const schema = z.union([addSchema, deleteSchema]);

export type HolidayPostInputType = z.infer<typeof schema>;
export type OutputType = Selectable<Holidays>;

export const postHoliday = async (body: HolidayPostInputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/holidays`, {
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