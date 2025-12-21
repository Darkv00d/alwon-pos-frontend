import { z } from "zod";
import superjson from "superjson";

// Schema for validating headers
export const schema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  locationIds: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map(Number).filter((id) => !isNaN(id)) : undefined
    ),
});

export type InputType = z.infer<typeof schema>;

export type SalesSummaryItem = {
  locationId: number;
  total: string;
  tickets: string;
};

export type OutputType = {
  ok: true;
  summary: SalesSummaryItem[];
};

export type ErrorOutputType = { error: string };

export const getAdminReportsSalesSummary = async (
  filters: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (filters.from) {
    headers.set("X-Date-From", filters.from.toISOString().split("T")[0]);
  }
  if (filters.to) {
    headers.set("X-Date-To", filters.to.toISOString().split("T")[0]);
  }
  if (filters.locationIds && filters.locationIds.length > 0) {
    headers.set("X-Location-Ids", filters.locationIds.join(","));
  }

  const result = await fetch(`/_api/admin/reports/sales_summary`, {
    method: "GET",
    ...init,
    headers,
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<ErrorOutputType>(text);
    throw new Error(errorObject.error || "An unknown error occurred");
  }

  return superjson.parse<OutputType>(text);
};