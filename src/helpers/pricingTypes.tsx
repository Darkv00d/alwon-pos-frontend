/**
 * This file contains pure TypeScript types for the pricing and cart system.
 * It has no backend dependencies and is safe to be imported by both frontend
 * and backend helpers to avoid circular dependencies.
 */

export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
}

export interface CartItemWithDiscount extends CartItem {
  unitPrice: number;
  lineTotal: number;
  discount: number;
}

export interface PromotionDiscount {
  discount: number;
  appliedItems: Array<{
    productId: number;
    quantity: number;
    discountAmount: number;
  }>;
  promotionId: string;
}

export interface BestPromotionResult {
  discount: number;
  promotionId: string;
  details: any;
}

export interface CouponValidationResult {
  valid: boolean;
  promotion?: any;
  error?: string;
}

export interface CartTotal {
  subtotal: number;
  discount: number;
  total: number;
  items: CartItemWithDiscount[];
  appliedPromotion?: {
    promotionId: string;
    discount: number;
    type: string;
  };
  appliedCoupon?: {
    code: string;
    discount: number;
  };
}

export interface ProductPriceDetails {
  price: number;
  originalPrice: number;
  priceSource: "base" | "specific";
}