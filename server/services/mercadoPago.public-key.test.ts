import { describe, expect, it } from "vitest";

describe("Public Key de teste do Mercado Pago", () => {
  it("permite consultar os meios de pagamento sem expor credenciais privadas", async () => {
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
    expect(publicKey).toMatch(/^APP_USR-/);

    const response = await fetch(`https://api.mercadopago.com/v1/payment_methods?public_key=${encodeURIComponent(publicKey!)}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  }, 20_000);
});
