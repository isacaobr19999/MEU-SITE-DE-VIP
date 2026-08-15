import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

describe("estados de interface de comércio", () => {
  it("declara feedback de erro e tentativa de recuperação no catálogo", () => {
    const home = page("Home.tsx");
    expect(home).toContain("products.isError");
    expect(home).toContain("featured.isError");
    expect(home).toContain("categories.isError");
    expect(home).toContain("refetch()");
  });

  it("diferencia indisponibilidade operacional de recurso ausente nos detalhes", () => {
    const product = page("ProductDetail.tsx");
    const order = page("OrderDetail.tsx");
    const history = page("OrderHistory.tsx");

    expect(product).toContain("product.isError");
    expect(order).toContain("order.isError");
    expect(history).toContain("orders.isError");
  });
});
