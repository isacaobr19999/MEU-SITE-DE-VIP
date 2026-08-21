import { describe, expect, it } from "vitest";
import { getPublicPromotionDiscountLabel, isPublicPromotionCurrent, promotionAppliesToActiveCatalog } from "./publicPromotion";

describe("promoções públicas", () => {
  const now = new Date("2026-08-21T12:00:00.000Z");
  const baseCoupon = {
    active: true,
    type: "PERCENTAGE" as const,
    percentageBasisPoints: 1000,
    fixedDiscountCents: null,
    startsAt: new Date("2026-08-20T00:00:00.000Z"),
    endsAt: new Date("2026-08-31T23:59:00.000Z"),
    maxUses: 30,
  };

  it("expõe somente cupons no período, ativos e ainda não esgotados", () => {
    expect(isPublicPromotionCurrent(baseCoupon, 0, now)).toBe(true);
    expect(isPublicPromotionCurrent({ ...baseCoupon, active: false }, 0, now)).toBe(false);
    expect(isPublicPromotionCurrent({ ...baseCoupon, endsAt: new Date("2026-08-20T23:59:00.000Z") }, 0, now)).toBe(false);
    expect(isPublicPromotionCurrent(baseCoupon, 30, now)).toBe(false);
  });

  it("mantém campanhas restritas ocultas quando não se aplicam ao catálogo ativo", () => {
    const activeProducts = new Set([2, 3, 4]);
    expect(promotionAppliesToActiveCatalog([], activeProducts)).toBe(true);
    expect(promotionAppliesToActiveCatalog([3], activeProducts)).toBe(true);
    expect(promotionAppliesToActiveCatalog([99], activeProducts)).toBe(false);
  });

  it("formata descontos percentuais e fixos sem expor regras internas", () => {
    expect(getPublicPromotionDiscountLabel(baseCoupon)).toBe("10% de desconto");
    expect(getPublicPromotionDiscountLabel({ type: "FIXED", percentageBasisPoints: null, fixedDiscountCents: 490 })).toBe("R$ 4,90 de desconto");
  });
});
