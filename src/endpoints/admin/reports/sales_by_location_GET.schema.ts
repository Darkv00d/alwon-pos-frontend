import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  locationIds: z.array(z.coerce.number().int().positive()).optional(),
});

export type InputType = z.infer<typeof schema>;

export type SalesByLocationReportItem = {
  locationId: number;
  locationName: string;
  totalTransactions: number;
  totalSales: number;
  averageTicket: number;
  firstSale: Date | null;
  lastSale: Date | null;
};

export type OutputType = {
  success: true;
  data: SalesByLocationReportItem[];
  period: {
    startDate: string | null;
    endDate: string | null;
  };
};

export type ErrorOutputType = { error: string };

export const getAdminReportsSalesByLocation = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const url = new URL(
    `/_api/admin/reports/sales_by_location`,
    window.location.origin
  );

  if (params.startDate) {
    url.searchParams.set("startDate", params.startDate.toISOString().split("T")[0]);
  }
  if (params.endDate) {
    url.searchParams.set("endDate", params.endDate.toISOString().split("T")[0]);
  }
  if (params.locationIds && params.locationIds.length > 0) {
    url.searchParams.set("locationIds", params.locationIds.join(','));
  }

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const errorObject = superjson.parse<ErrorOutputType>(text);
    throw new Error(errorObject.error || "An unknown error occurred");
  }

  return superjson.parse<OutputType>(text);
};