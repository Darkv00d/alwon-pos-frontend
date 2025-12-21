import { db } from "./db";
import {
  Promotions,
  Products,
  ProductPrices,
  Coupons,
  PromotionProducts,
  PromotionCategories,
} from "./schema";
import { Selectable } from "kysely";
import { parse, isWithinInterval, getDay } from "date-fns";
import type {
  CartItem,
  ProductPriceDetails,
  PromotionDiscount,
  CartTotal,
} from "./pricingTypes";

// Backend-specific types that extend the base types
type BestPromotionResult = {
  discount: number;
  promotionId: string;
  promotion: Selectable<Promotions>;
};

type CouponValidationResult = {
  valid: boolean;
  promotion?: Selectable<Promotions>;
  error?: string;
};

// Internal CartItem type for pricing engine that includes unitPrice
type PricingCartItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type PricingContext = {
  productId: number;
  quantity: number;
  locationId?: number;
  channel?: 'pos' | 'kiosk' | 'online' | 'wholesale';
  customerId?: number;
  timestamp?: Date;
};

export type PriceResult = {
  basePrice: number;
  finalPrice: number;
  discount: number;
  appliedPromotions: Array<{
    promotionId: string;
    promotionName: string;
    discountAmount: number;
  }>;
};

/**
 * Fetches the effective price for a product based on location, channel, and current time.
 * Falls back to the base product price if no specific pricing rule is found.
 */
export async function getProductPrice(
  productId: number,
  locationId?: number,
  channel?: string
): Promise<ProductPriceDetails | null> {
  const now = new Date();

  const product = await db
    .selectFrom("products")
    .select(["price"])
    .where("id", "=", productId)
    .executeTakeFirst();

  if (!product) {
    console.error(`[pricingEngine] Product with id ${productId} not found.`);
    return null;
  }
  const originalPrice = parseFloat(product.price as string);

  let query = db
    .selectFrom("productPrices")
    .selectAll()
    .where("productId", "=", productId)
    .where("effectiveFrom", "<=", now)
    .orderBy("effectiveFrom", "desc");

  if (locationId) {
    query = query.where("locationId", "=", locationId);
  }
  if (channel) {
    query = query.where("channel", "=", channel);
  }

  const specificPrices = await query.execute();

  const applicablePrice = specificPrices.find(
    (p) => !p.effectiveTo || p.effectiveTo > now
  );

  if (applicablePrice) {
    return {
      price: parseFloat(applicablePrice.price as string),
      originalPrice,
      priceSource: "specific",
    };
  }

  return {
    price: originalPrice,
    originalPrice,
    priceSource: "base",
  };
}

/**
 * Retrieves all promotions that are currently active.
 * If locationId is provided, filters promotions by location.
 */
export async function getActivePromotions(
  now: Date = new Date(),
  locationId?: number
): Promise<Selectable<Promotions>[]> {
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const dayOfWeek = getDay(now); // Sunday is 0, Monday is 1, etc.

  let query = db
    .selectFrom("promotions")
    .selectAll()
    .where("isActive", "=", true)
    .where("startDate", "<=", now)
    .where((eb) =>
      eb.or([eb("endDate", "is", null), eb("endDate", ">=", now)])
    );

    // Filter by location if provided
  if (locationId) {
    const promotionIdsForLocation = await db
      .selectFrom("promotionLocations")
      .select("promotionId")
      .where("locationId", "=", locationId)
      .execute();
    
    const locationPromotionIds = promotionIdsForLocation.map(p => p.promotionId);
    
    // Only add the IN clause if there are location-specific promotions
    if (locationPromotionIds.length > 0) {
      query = query.where((eb) =>
        eb.or([
          eb("appliesToAllLocations", "=", true),
          eb("id", "in", locationPromotionIds)
        ])
      );
    } else {
      // If no location-specific promotions, only show global promotions
      query = query.where("appliesToAllLocations", "=", true);
    }
  }

  const promotions = await query
    .orderBy("priority", "desc")
    .orderBy("createdAt", "desc")
    .execute();

  return promotions.filter((p) => {
    const isTimeValid =
      !p.startTime ||
      !p.endTime ||
      (currentTime >= p.startTime && currentTime <= p.endTime);
    const isDayValid =
      !p.daysOfWeek ||
      p.daysOfWeek.length === 0 ||
      p.daysOfWeek.includes(dayOfWeek);
    return isTimeValid && isDayValid;
  });
}

/**
 * Calculates the discount for a specific promotion given the cart items.
 */
export async function calculatePromotionDiscount(
  promotion: Selectable<Promotions>,
  items: PricingCartItem[],
  customerId?: number
): Promise<PromotionDiscount | null> {
  // Check usage limits
  if (
    promotion.maxTotalUses !== null &&
    (promotion.currentUses || 0) >= promotion.maxTotalUses
  ) {
    return null;
  }

  if (customerId && promotion.maxUsesPerCustomer !== null) {
    const customerUsage = await db
      .selectFrom("promotionUsage")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .where("promotionId", "=", promotion.id)
      .where("customerId", "=", customerId)
      .executeTakeFirst();
    if ((customerUsage?.count || 0) >= promotion.maxUsesPerCustomer) {
      return null;
    }
  }

  const promotionProducts = await db
    .selectFrom("promotionProducts")
    .selectAll()
    .where("promotionId", "=", promotion.id)
    .execute();
  const promotionCategories = await db
    .selectFrom("promotionCategories")
    .selectAll()
    .where("promotionId", "=", promotion.id)
    .execute();

  const productIdsInPromo = promotionProducts.map((p) => p.productId);
  const categoryIdsInPromo = promotionCategories.map((c) => c.categoryId);

    const productsWithCategories =
    categoryIdsInPromo.length > 0 && items.length > 0
      ? await db
          .selectFrom("products")
          .select(["id", "categoryId"])
          .where(
            "id",
            "in",
            items.map((i) => i.productId)
          )
          .execute()
      : [];

  const applicableItems = items.filter((item) => {
    if (productIdsInPromo.includes(item.productId)) return true;
    const productCategory = productsWithCategories.find(
      (p) => p.id === item.productId
    )?.categoryId;
    if (productCategory && categoryIdsInPromo.includes(productCategory))
      return true;
    return false;
  });

  if (applicableItems.length === 0) return null;

  const totalQuantity = applicableItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalValue = applicableItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  if (promotion.minQuantity && totalQuantity < promotion.minQuantity) {
    return null;
  }

  let discount = 0;
  const appliedItems: PromotionDiscount["appliedItems"] = [];

  switch (promotion.promotionType) {
    case "PERCENTAGE_OFF":
      if (promotion.discountPercentage) {
        discount = totalValue * (parseFloat(promotion.discountPercentage as string) / 100);
      }
      break;
    case "AMOUNT_OFF":
      if (promotion.discountAmount) {
        discount = Math.min(totalValue, parseFloat(promotion.discountAmount as string));
      }
      break;
    case "BUY_X_GET_Y":
      if (promotion.buyQuantity && promotion.getQuantity) {
        const buyX = promotion.buyQuantity;
        const getY = promotion.getQuantity;
        const numSets = Math.floor(totalQuantity / (buyX + getY));
        if (numSets > 0) {
          const freeItemsCount = numSets * getY;
          // Find cheapest items to apply discount to
          const sortedItems = [...applicableItems].sort(
            (a, b) => a.unitPrice - b.unitPrice
          );
          let freeItemsApplied = 0;
          for (const item of sortedItems) {
            const itemsToMakeFree = Math.min(
              item.quantity,
              freeItemsCount - freeItemsApplied
            );
            if (itemsToMakeFree > 0) {
              const itemDiscount = itemsToMakeFree * item.unitPrice;
              discount += itemDiscount;
              appliedItems.push({
                productId: item.productId,
                quantity: itemsToMakeFree,
                discountAmount: itemDiscount,
              });
              freeItemsApplied += itemsToMakeFree;
            }
            if (freeItemsApplied >= freeItemsCount) break;
          }
        }
      }
      break;
    case "BUNDLE": {
      const requiredProducts = promotionProducts.filter((p) => p.isRequired);
      const allRequiredInCart = requiredProducts.every((rp) =>
        items.some((item) => item.productId === rp.productId)
      );
      if (allRequiredInCart && promotion.discountAmount) {
        const bundleValue = applicableItems.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        discount = bundleValue - parseFloat(promotion.discountAmount as string);
        discount = Math.max(0, Math.min(bundleValue, discount));
      }
      break;
    }
    case "VOLUME_DISCOUNT":
      if (
        promotion.minQuantity &&
        totalQuantity >= promotion.minQuantity &&
        promotion.discountPercentage
      ) {
        discount = totalValue * (parseFloat(promotion.discountPercentage as string) / 100);
      }
      break;
    // HAPPY_HOUR is typically handled by time filters, but could have specific logic
    case "HAPPY_HOUR":
      if (promotion.discountPercentage) {
        discount = totalValue * (parseFloat(promotion.discountPercentage as string) / 100);
      }
      break;
    default:
      return null;
  }

  if (discount <= 0) return null;

  // Distribute discount proportionally if not already specified
  if (appliedItems.length === 0) {
    for (const item of applicableItems) {
      const itemValue = item.quantity * item.unitPrice;
      const proportion = totalValue > 0 ? itemValue / totalValue : 0;
      const itemDiscount = discount * proportion;
      appliedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        discountAmount: itemDiscount,
      });
    }
  }

  return {
    discount,
    appliedItems,
    promotionId: promotion.id,
  };
}

/**
 * Finds and returns the best promotion (highest discount) for the given cart.
 */
export async function applyBestPromotion(
  items: PricingCartItem[],
  customerId?: number,
  locationId?: number
): Promise<BestPromotionResult | null> {
  const activePromotions = await getActivePromotions(new Date(), locationId);
  let bestPromotion: BestPromotionResult | null = null;

  for (const promotion of activePromotions) {
    const result = await calculatePromotionDiscount(
      promotion,
      items,
      customerId
    );
    if (result) {
      if (!bestPromotion || result.discount > bestPromotion.discount) {
        bestPromotion = {
          discount: result.discount,
          promotionId: promotion.id,
          promotion,
        };
      }
    }
  }

  return bestPromotion;
}

/**
 * Validates a coupon code.
 */
export async function validateCoupon(
  couponCode: string,
  customerId?: number
): Promise<CouponValidationResult> {
  const coupon = await db
    .selectFrom("coupons")
    .selectAll()
    .where("code", "=", couponCode)
    .executeTakeFirst();

  if (!coupon) {
    return { valid: false, error: "Coupon not found." };
  }
  if (!coupon.isActive) {
    return { valid: false, error: "Coupon is not active." };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "Coupon has expired." };
  }
  if (
    coupon.maxUses !== null &&
    (coupon.currentUses || 0) >= coupon.maxUses
  ) {
    return { valid: false, error: "Coupon has reached its usage limit." };
  }
  if (coupon.customerId !== null && coupon.customerId !== customerId) {
    return { valid: false, error: "Coupon is not valid for this customer." };
  }
  if (!coupon.promotionId) {
    return { valid: false, error: "Coupon is not linked to any promotion." };
  }

  const promotion = await db
    .selectFrom("promotions")
    .selectAll()
    .where("id", "=", coupon.promotionId)
    .executeTakeFirst();

  if (!promotion || !promotion.isActive) {
    return {
      valid: false,
      error: "The promotion linked to this coupon is not active.",
    };
  }

  return { valid: true, promotion };
}

/**
 * Calculates the final total for a shopping cart, applying dynamic pricing and the best promotion or coupon.
 */
export async function calculateCartTotal(
  items: { productId: number; quantity: number }[],
  customerId?: number,
  locationId?: number,
  channel?: string,
  couponCode?: string
): Promise<CartTotal> {
  const pricedItems: PricingCartItem[] = [];
  for (const item of items) {
    const priceDetails = await getProductPrice(
      item.productId,
      locationId,
      channel
    );
    if (priceDetails) {
      pricedItems.push({ ...item, unitPrice: priceDetails.price });
    } else {
      // Fallback or error
      console.warn(`Could not fetch price for product ${item.productId}`);
      pricedItems.push({ ...item, unitPrice: 0 });
    }
  }

  const subtotal = pricedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  let totalDiscount = 0;
  const result: CartTotal = {
    subtotal,
    discount: 0,
    total: subtotal,
    items: pricedItems.map((item) => ({
      ...item,
      price: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      discount: 0,
    })),
  };

  let couponDiscountResult: PromotionDiscount | null = null;
  if (couponCode) {
    const couponValidation = await validateCoupon(couponCode, customerId);
    if (couponValidation.valid && couponValidation.promotion) {
      couponDiscountResult = await calculatePromotionDiscount(
        couponValidation.promotion,
        pricedItems,
        customerId
      );
      if (couponDiscountResult) {
        result.appliedCoupon = {
          code: couponCode,
          discount: couponDiscountResult.discount,
        };
        totalDiscount += couponDiscountResult.discount;
      }
    }
  }

  // Apply best automatic promotion if no coupon was applied or if promotions can stack (not implemented, assuming they don't)
  if (!couponDiscountResult) {
    const bestPromo = await applyBestPromotion(pricedItems, customerId, locationId);
    if (bestPromo) {
      const promoDiscountResult = await calculatePromotionDiscount(
        bestPromo.promotion,
        pricedItems,
        customerId
      );
      if (promoDiscountResult) {
        result.appliedPromotion = {
          promotionId: bestPromo.promotionId,
          discount: promoDiscountResult.discount,
          type: bestPromo.promotion.promotionType,
        };
        totalDiscount += promoDiscountResult.discount;
      }
    }
  }

  // Apply discount to line items
  if (totalDiscount > 0) {
    const discountableValue = result.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    if (discountableValue > 0) {
      for (const item of result.items) {
        const proportion = item.lineTotal / discountableValue;
        item.discount = totalDiscount * proportion;
      }
    }
  }

  result.discount = totalDiscount;
  result.total = Math.max(0, subtotal - totalDiscount);

  return result;
}

/**
 * Simplified wrapper function to calculate price with promotions for a single product.
 * This is a convenience function that wraps the full cart calculation logic.
 * 
 * @deprecated Use calculatePrice instead for better performance and simpler API
 * 
 * @param context - Pricing context including product, quantity, location, channel, customer, and timestamp
 * @returns PriceResult with base price, final price, discount, and applied promotions
 * 
 * @example
 * const result = await calculatePriceWithPromotions({
 *   productId: 123,
 *   quantity: 2,
 *   locationId: 1,
 *   channel: 'pos',
 *   customerId: 456,
 *   timestamp: new Date()
 * });
 * console.log(result.finalPrice); // Final price after promotions
 */
export async function calculatePriceWithPromotions(
  context: PricingContext
): Promise<PriceResult> {
  const {
    productId,
    quantity,
    locationId,
    channel = 'pos',
    customerId,
    timestamp = new Date(),
  } = context;

  // Get the base price for this product
  const priceDetails = await getProductPrice(productId, locationId, channel);
  
  if (!priceDetails) {
    return {
      basePrice: 0,
      finalPrice: 0,
      discount: 0,
      appliedPromotions: [],
    };
  }

  const basePrice = priceDetails.price;
  const totalBasePrice = basePrice * quantity;

  // Calculate cart total with promotions
  const cartTotal = await calculateCartTotal(
    [{ productId, quantity }],
    customerId,
    locationId,
    channel
  );

  const discount = cartTotal.discount;
  const finalPrice = cartTotal.total;

  // Extract applied promotions
  const appliedPromotions: PriceResult['appliedPromotions'] = [];

  if (cartTotal.appliedPromotion) {
    const promotion = await db
      .selectFrom('promotions')
      .select(['id', 'name'])
      .where('id', '=', cartTotal.appliedPromotion.promotionId)
      .executeTakeFirst();
    
    if (promotion) {
      appliedPromotions.push({
        promotionId: promotion.id,
        promotionName: promotion.name,
        discountAmount: cartTotal.appliedPromotion.discount,
      });
    }
  }

  if (cartTotal.appliedCoupon) {
    // Coupon is linked to a promotion, try to get the promotion name
    const coupon = await db
      .selectFrom('coupons')
      .innerJoin('promotions', 'coupons.promotionId', 'promotions.id')
      .select(['promotions.id', 'promotions.name'])
      .where('coupons.code', '=', cartTotal.appliedCoupon.code)
      .executeTakeFirst();
    
    if (coupon) {
      appliedPromotions.push({
        promotionId: coupon.id,
        promotionName: `${coupon.name} (Coupon: ${cartTotal.appliedCoupon.code})`,
        discountAmount: cartTotal.appliedCoupon.discount,
      });
    }
  }

  return {
    basePrice: totalBasePrice,
    finalPrice,
    discount,
    appliedPromotions,
  };
}

/**
 * Helper that returns only the number of the base price
 */
async function getBasePrice(
  productId: number,
  locationId?: number,
  channel?: 'pos' | 'kiosk' | 'online' | 'wholesale'
): Promise<number> {
  const priceDetails = await getProductPrice(productId, locationId, channel);
  return priceDetails?.price || 0;
}

/**
 * Finds promotions applicable to a specific product
 */
async function findApplicablePromotions(
  productId: number,
  quantity: number,
  timestamp: Date,
  locationId?: number
): Promise<Selectable<Promotions>[]> {
  const activePromotions = await getActivePromotions(timestamp, locationId);
  
  // Filter promotions that apply to this product
  const applicablePromotions: Selectable<Promotions>[] = [];
  
  for (const promo of activePromotions) {
    const promotionProducts = await db
      .selectFrom('promotionProducts')
      .selectAll()
      .where('promotionId', '=', promo.id)
      .execute();
    
    const promotionCategories = await db
      .selectFrom('promotionCategories')
      .selectAll()
      .where('promotionId', '=', promo.id)
      .execute();
    
    // Check if product is directly in promotion
    if (promotionProducts.some(p => p.productId === productId)) {
      applicablePromotions.push(promo);
      continue;
    }
    
    // Check if product category is in promotion
    if (promotionCategories.length > 0) {
      const product = await db
        .selectFrom('products')
        .select(['categoryId'])
        .where('id', '=', productId)
        .executeTakeFirst();
      
      if (product?.categoryId && promotionCategories.some(c => c.categoryId === product.categoryId)) {
        applicablePromotions.push(promo);
      }
    }
  }
  
  return applicablePromotions;
}

/**
 * Simplified version of promotion discount calculation
 */
function calculateSimplePromotionDiscount(
  promotion: any,
  basePrice: number,
  quantity: number
): number {
  switch (promotion.promotionType) {
    case 'PERCENTAGE_OFF':
      return basePrice * quantity * (Number(promotion.discountPercentage) / 100);

    case 'AMOUNT_OFF':
      return Number(promotion.discountAmount) * quantity;

    case 'BUY_X_GET_Y':
      const buyQty = promotion.buyQuantity || 1;
      const getQty = promotion.getQuantity || 1;
      const sets = Math.floor(quantity / (buyQty + getQty));
      const freeItems = sets * getQty;
      return basePrice * freeItems;

    case 'VOLUME_DISCOUNT':
      if (quantity >= (promotion.minQuantity || 0)) {
        return basePrice * quantity * (Number(promotion.discountPercentage) / 100);
      }
      return 0;

    case 'HAPPY_HOUR':
      return basePrice * quantity * (Number(promotion.discountPercentage) / 100);

    default:
      return 0;
  }
}

/**
 * Main pricing engine - calculates price with promotions for a single product
 */
export async function calculatePrice(
  context: PricingContext
): Promise<PriceResult> {
  const timestamp = context.timestamp || new Date();
  
  // 1. Obtener precio base
  const basePrice = await getBasePrice(
    context.productId,
    context.locationId,
    context.channel
  );

  // 2. Buscar promociones aplicables
  const promotions = await findApplicablePromotions(
    context.productId,
    context.quantity,
    timestamp,
    context.locationId
  );

  // 3. Aplicar mejor promoción (mayor descuento)
  let bestDiscount = 0;
  let appliedPromotions: Array<{
    promotionId: string;
    promotionName: string;
    discountAmount: number;
  }> = [];

  for (const promo of promotions) {
    const discount = calculateSimplePromotionDiscount(promo, basePrice, context.quantity);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      appliedPromotions = [{
        promotionId: promo.id,
        promotionName: promo.name,
        discountAmount: discount,
      }];
    }
  }

  const subtotal = basePrice * context.quantity;
  const finalPrice = Math.max(0, subtotal - bestDiscount);

  return {
    basePrice: subtotal,
    finalPrice,
    discount: bestDiscount,
    appliedPromotions,
  };
}

/**
 * Calculates price total for a shopping cart
 */
export async function calculateCartPrice(
  items: Array<{
    productId: number;
    quantity: number;
  }>,
  context: {
    locationId?: number;
    channel?: 'pos' | 'kiosk' | 'online';
    customerId?: number;
    couponCode?: string;
  }
): Promise<{
  items: Array<PriceResult & { productId: number }>;
  subtotal: number;
  totalDiscount: number;
  total: number;
}> {
  const pricedItems = await Promise.all(
    items.map(async (item) => {
      const pricing = await calculatePrice({
        ...item,
        ...context,
      });
      return { ...pricing, productId: item.productId };
    })
  );

  const subtotal = pricedItems.reduce((sum, item) => sum + item.basePrice, 0);
  const totalDiscount = pricedItems.reduce((sum, item) => sum + item.discount, 0);
  const total = pricedItems.reduce((sum, item) => sum + item.finalPrice, 0);

  return {
    items: pricedItems,
    subtotal,
    totalDiscount,
    total,
  };
}