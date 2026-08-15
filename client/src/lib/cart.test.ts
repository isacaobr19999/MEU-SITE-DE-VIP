import { describe, expect, it } from "vitest";
import { addCartItem, type StoreProduct } from "./cart";

const product: StoreProduct = {
  id: 1,
  name: "VIP Ouro",
  slug: "vip-ouro",
  shortDescription: null,
  kind: "VIP",
  imageUrl: null,
  priceCents: 2990,
  durationDays: 30,
  featured: true,
  categoryName: "VIPs",
  categorySlug: "vips",
};

describe("carrinho", () => {
  it("agrega somente a mesma combinação de produto e servidor", () => {
    const first = addCartItem([], product, 10, "Survival");
    const repeated = addCartItem(first, product, 10, "Survival");
    const otherServer = addCartItem(repeated, product, 11, "SkyBlock");

    expect(repeated).toHaveLength(1);
    expect(repeated[0]?.quantity).toBe(2);
    expect(otherServer).toHaveLength(2);
  });
});
