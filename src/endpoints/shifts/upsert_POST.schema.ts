import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Shifts } from "../../helpers/schema";

export const schema = z.object({
  id: z.string().optional(),
  locationId: z.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date({
    required_error: "Start time is required.",
    invalid_type_error: "Invalid start time format.",
  }),
  endsAt: z.coerce.date({
    required_error: "End time is required.",
    invalid_type_error: "Invalid end time format.",
  }),
  breakMinutes: z.number().int().nonnegative().default(0).optional(),
  role: z.string().nullable().optional(),
  published: z.boolean().default(false).optional(),
  employeeUuids: z.array(z.string().uuid()).default([]).optional(),
}).refine(data => data.endsAt > data.startsAt, {
  message: "End time must be after start time.",
  path: ["endsAt"],
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Shifts> & {
  employeeUuids: string[];
};

export const postUpsertShift = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/shifts/upsert`, {
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