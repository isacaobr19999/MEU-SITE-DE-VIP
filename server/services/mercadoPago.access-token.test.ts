import { describe, expect, it } from "vitest";

describe("Access Token de teste do Mercado Pago", () => {
  it("autentica na consulta leve de meios de pagamento", async () => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    expect(accessToken).toMatch(/^APP_USR-/);

    const response = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status).toBe(200);
    const paymentMethods = await response.json();
    expect(Array.isArray(paymentMethods)).toBe(true);
  }, 20_000);
});
