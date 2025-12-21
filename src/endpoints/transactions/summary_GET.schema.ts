import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Locations, Transactions } from "../../helpers/schema";

// Schema for validating query parameters
export const schema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  locationIds: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map(Number).filter(id => !isNaN(id)) : undefined
    ),
});

export type InputType = z.infer<typeof schema>;

export type TransactionSummary = {
  locationId: Selectable<Transactions>["locationId"];
  locationName: Selectable<Locations>["name"];
  total: string; // Kysely returns sum of numeric as string
  tickets: string; // Kysely returns count as bigint, which serializes to string
};

// Output can be a success response or an error response
export type OutputType = TransactionSummary[];
export type ErrorOutputType = { error: string };

export const getTransactionsSummary = async (
  query: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (query.from) {
    params.set("from", query.from.toISOString().split("T")[0]);
  }
  if (query.to) {
    params.set("to", query.to.toISOString().split("T")[0]);
  }
  if (query.locationIds && query.locationIds.length > 0) {
    params.set("locationIds", query.locationIds.join(","));
  }

  const result = await fetch(`/_api/transactions/summary?${params.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<ErrorOutputType>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};