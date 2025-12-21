import { schema, OutputType, InputType } from "./validate_POST.schema";
import superjson from "superjson";
import { validateCoupon } from "../../helpers/pricingEngine";

export async function handle(request: Request) {
  try {
    const json = superjson.parse<InputType>(await request.text());
    const { code, customerId } = schema.parse(json);

    console.log(`Validating coupon code: ${code} for customer: ${customerId}`);

    const validationResult = await validateCoupon(code, customerId);

    return new Response(
      superjson.stringify(validationResult satisfies OutputType)
    );
  } catch (error) {
    console.error("Error validating coupon:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}