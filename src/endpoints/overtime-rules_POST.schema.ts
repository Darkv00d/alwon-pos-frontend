import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type OvertimeRules } from "../helpers/schema";

export const schema = z.object({
  dailyThresholdMinutes: z.number(),
  weeklyThresholdMinutes: z.number(),
  nightStart: z.string(),
  nightEnd: z.string(),
  nightMultiplier: z.string(),
  holidayMultiplier: z.string(),
});

export type OvertimeRulePostInputType = z.infer<typeof schema>;
export type OutputType = Selectable<OvertimeRules>;

export const postOvertimeRule = async (body: OvertimeRulePostInputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/overtime-rules`, {
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