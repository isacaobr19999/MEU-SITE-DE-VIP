import { describe, expect, it } from "vitest";
import { assertOrderTransition, calculateCouponDiscount, canTransitionOrder } from "./commerce";

describe("regras de pedido", () => {
  it("permite somente as transições comerciais previstas", () => {
    expect(canTransitionOrder("WAITING_PAYMENT", "PAID")).toBe(true);
    expect(canTransitionOrder("COMPLETED", "PROCESSING")).toBe(false);
    expect(() => assertOrderTransition("COMPLETED", "PROCESSING")).toThrow("não permitida");
  });

  it("calcula descontos sem ultrapassar o subtotal", () => {
    expect(calculateCouponDiscount(2990, { type: "PERCENTAGE", percentageBasisPoints: 1000 })).toBe(299);
    expect(calculateCouponDiscount(2990, { type: "FIXED", fixedDiscountCents: 5000 })).toBe(2990);
  });
});
