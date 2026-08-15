import { describe, expect, it } from "vitest";
import { verifyMercadoPagoWebhook } from "./mercadoPago";

describe("segredo do webhook Mercado Pago", () => {
  it("é carregado e usado pela validação de assinatura", () => {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    expect(secret).toMatch(/^[a-f0-9]{64}$/i);
    expect(() => verifyMercadoPagoWebhook({ signature: "ts=1,v1=invalid", requestId: "secret-check", dataId: "1" })).toThrow();
  });
});
