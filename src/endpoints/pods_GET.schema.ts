import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Pods, Stops } from "../helpers/schema";

export const schema = z.object({
  stopId: z.string().uuid().optional(),
});

export type InputType = z.infer<typeof schema>;

export type PodWithStop = Selectable<Pods> & {
  stop: Selectable<Stops> | null;
};

export type OutputType = {
  pods: PodWithStop[];
};

export const getPods = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.stopId) {
    searchParams.set("stopId", params.stopId);
  }

  const result = await fetch(`/_api/pods?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(
      await result.text()
    );
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};