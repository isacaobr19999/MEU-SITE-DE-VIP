export const ORDER_STATUS = ["PENDING", "WAITING_PAYMENT", "PAID", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"] as const;
export type OrderStatusValue = (typeof ORDER_STATUS)[number];

const orderTransitions: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING: ["WAITING_PAYMENT", "CANCELLED", "FAILED"],
  WAITING_PAYMENT: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "REFUNDED", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
};

export function canTransitionOrder(from: OrderStatusValue, to: OrderStatusValue) {
  return orderTransitions[from].includes(to);
}

export function assertOrderTransition(from: OrderStatusValue, to: OrderStatusValue) {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Transição de pedido não permitida: ${from} → ${to}`);
  }
}

export type CouponRule = {
  type: "PERCENTAGE" | "FIXED";
  percentageBasisPoints?: number | null;
  fixedDiscountCents?: number | null;
};

/** Calcula descontos em centavos sem ponto flutuante e sem permitir total negativo. */
export function calculateCouponDiscount(subtotalCents: number, coupon: CouponRule) {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("Subtotal inválido");
  }
  if (coupon.type === "PERCENTAGE") {
    const basisPoints = coupon.percentageBasisPoints ?? 0;
    return Math.min(subtotalCents, Math.floor((subtotalCents * basisPoints) / 10_000));
  }
  return Math.min(subtotalCents, Math.max(0, coupon.fixedDiscountCents ?? 0));
}
