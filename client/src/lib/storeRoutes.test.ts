import { describe, expect, it } from "vitest";
import { STORE_ROUTES } from "./storeRoutes";

describe("rotas públicas da loja", () => {
  it("mantém um destino dedicado para abrir o carrinho", () => {
    expect(STORE_ROUTES).toMatchObject({
      HOME: "/",
      CART: "/cart",
    });
  });
});
