import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  employeeCode: z.string().min(1, "Código de empleado requerido."),
  pin: z.string().min(4, "PIN debe tener al menos 4 dígitos.").max(8, "PIN no puede tener más de 8 dígitos."),
  locationId: z.number().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  status: "clocked_in" | "clocked_out";
  todaysHours: number;
  lastPunch: Date;
  employeeName: string;
  locationName?: string;
};

export const postTimeclockPunch = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/timeclock/punch`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(text);
    throw new Error(errorObject.error || "An unknown error occurred");
  }

  return superjson.parse<OutputType>(text);
};