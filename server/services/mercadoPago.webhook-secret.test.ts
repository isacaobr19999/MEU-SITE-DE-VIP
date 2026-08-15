import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyMercadoPagoWebhook } from "./mercadoPago";

describe("segredo do webhook Mercado Pago", () => {
  it("aceita uma assinatura HMAC válida no formato do Mercado Pago sem mocks", () => {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET!;
    const dataId = "173021553017";
    const requestId = "signed-local-fixture";
    const timestamp = "1786779600";
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(() => verifyMercadoPagoWebhook({
      signature: `ts=${timestamp},v1=${signature}`,
      requestId,
      dataId,
    })).not.toThrow();
  });

  it("é carregado e usado pela validação de assinatura", () => {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    expect(secret).toMatch(/^[a-f0-9]{64}$/i);
    expect(() => verifyMercadoPagoWebhook({ signature: "ts=1,v1=invalid", requestId: "secret-check", dataId: "1" })).toThrow();
  });
});
