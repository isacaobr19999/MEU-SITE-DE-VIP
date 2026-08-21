export type PublicPromotionCoupon = {
  active: boolean;
  type: "PERCENTAGE" | "FIXED";
  percentageBasisPoints: number | null;
  fixedDiscountCents: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
};

export function isPublicPromotionCurrent(coupon: PublicPromotionCoupon, usedCount: number, now = new Date()) {
  if (!coupon.active) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.endsAt && coupon.endsAt < now) return false;
  if (coupon.maxUses !== null && usedCount >= coupon.maxUses) return false;
  return true;
}

export function promotionAppliesToActiveCatalog(scopedProductIds: number[], activeProductIds: ReadonlySet<number>) {
  if (!activeProductIds.size) return false;
  return !scopedProductIds.length || scopedProductIds.some(productId => activeProductIds.has(productId));
}

export function getPublicPromotionDiscountLabel(coupon: Pick<PublicPromotionCoupon, "type" | "percentageBasisPoints" | "fixedDiscountCents">) {
  if (coupon.type === "PERCENTAGE") {
    const percentage = (coupon.percentageBasisPoints ?? 0) / 100;
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(percentage)}% de desconto`;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((coupon.fixedDiscountCents ?? 0) / 100) + " de desconto";
}
