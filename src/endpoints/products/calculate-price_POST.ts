import { schema, OutputType } from "./calculate-price_POST.schema";
import { calculatePrice } from "../../helpers/pricingEngine";
import superjson from "superjson";

export const handle = async (request: Request) => {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const {
      productId,
      quantity,
      locationId,
      channel = 'pos',
      customerId,
    } = input;

    // Uses the new pricing API - calculatePrice is the recommended and more efficient function
    const priceResult = await calculatePrice({
      productId,
      quantity,
      locationId,
      channel,
      customerId,
      timestamp: new Date(),
    });

    const responseData: OutputType = {
      success: true,
      data: {
        basePrice: priceResult.basePrice,
        finalPrice: priceResult.finalPrice,
        discount: priceResult.discount,
        appliedPromotions: priceResult.appliedPromotions,
      },
    };

    return new Response(superjson.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[products/calculate-price] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      superjson.stringify({ success: false, error: errorMessage } satisfies OutputType),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};