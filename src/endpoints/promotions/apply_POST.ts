import { schema, OutputType, InputType } from "./apply_POST.schema";
import superjson from "superjson";
import { calculateCartTotal } from "../../helpers/pricingEngine";

export async function handle(request: Request) {
  try {
    const json = superjson.parse<InputType>(await request.text());
    const { items, customerId, locationId, channel, couponCode } =
      schema.parse(json);

    console.log("Applying promotions for cart:", {
      itemCount: items.length,
      customerId,
      locationId,
      couponCode,
    });

    // The pricing engine expects items without the 'price' field for its initial calculation.
    const engineItems = items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    }));

    const cartTotal = await calculateCartTotal(
      engineItems,
      customerId,
      locationId,
      channel,
      couponCode
    );

    return new Response(superjson.stringify(cartTotal satisfies OutputType));
  } catch (error) {
    console.error("Error applying promotions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}