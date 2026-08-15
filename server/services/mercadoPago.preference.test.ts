import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPreference: vi.fn() }));

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: class MercadoPagoConfig { constructor(_: unknown) {} },
  Preference: class Preference { create = mocks.createPreference },
  Payment: class Payment {},
  WebhookSignatureValidator: { validate: vi.fn() },
}));

import { createMercadoPagoPreference } from "./mercadoPago";

const input = {
  orderId: "00000000-0000-4000-8000-000000000001",
  orderNumber: "PSC-TESTE",
  totalCents: 100,
  items: [{ productId: 1, productName: "Validação", quantity: 1, unitPriceCents: 100 }],
};

describe("preferência Mercado Pago", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.APP_BASE_URL = "https://playstorcraft.com.br";
    mocks.createPreference.mockResolvedValue({
      id: "pref-1",
      init_point: "https://www.mercadopago.com.br/checkout/producao",
      sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/teste",
    });
  });

  it("usa o checkout padrão para credencial da conta vendedora de teste", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    await expect(createMercadoPagoPreference(input)).resolves.toEqual({
      preferenceId: "pref-1",
      checkoutUrl: "https://www.mercadopago.com.br/checkout/producao",
    });
  });

  it("usa o checkout de produção para credencial de produção", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "PROD-credential";
    await expect(createMercadoPagoPreference(input)).resolves.toEqual({
      preferenceId: "pref-1",
      checkoutUrl: "https://www.mercadopago.com.br/checkout/producao",
    });
  });

  it("usa a URL sandbox apenas quando o gateway não retorna init_point", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    mocks.createPreference.mockResolvedValue({ id: "pref-1", sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/teste" });
    await expect(createMercadoPagoPreference(input)).resolves.toEqual({ preferenceId: "pref-1", checkoutUrl: "https://sandbox.mercadopago.com.br/checkout/teste" });
  });
});
