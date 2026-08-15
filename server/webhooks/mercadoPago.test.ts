import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), getPayment: vi.fn(), applyPayment: vi.fn() }));

vi.mock("../services/mercadoPago", () => ({ verifyMercadoPagoWebhook: mocks.verify, getMercadoPagoPayment: mocks.getPayment }));
vi.mock("../db/payments", () => ({ applyMercadoPagoPayment: mocks.applyPayment }));

import { mercadoPagoWebhook } from "./mercadoPago";

function request(body: unknown, headers: Record<string, string> = {}, query: Record<string, string> = {}) {
  return { body, query, header: (name: string) => headers[name.toLowerCase()] } as any;
}

function response() {
  const res = { status: vi.fn(), json: vi.fn() } as any;
  res.status.mockReturnValue(res);
  return res;
}

describe("webhook Mercado Pago", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getPayment.mockResolvedValue({ id: 991, external_reference: "00000000-0000-0000-0000-000000000001", status: "approved", transaction_amount: 25 });
    mocks.applyPayment.mockResolvedValue({ status: "PAID" });
  });

  it("rejeita uma notificação cuja assinatura não é validada", async () => {
    mocks.verify.mockImplementation(() => { throw new Error("invalid"); });
    const res = response();
    await mercadoPagoWebhook(request({ type: "payment", data: { id: "991" } }, { "x-signature": "bad", "x-request-id": "req-1" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.getPayment).not.toHaveBeenCalled();
  });

  it("ignora tópicos não relacionados a pagamentos após validar a origem", async () => {
    const res = response();
    await mercadoPagoWebhook(request({ type: "merchant_order", data: { id: "991" } }, { "x-signature": "ok", "x-request-id": "req-1" }), res);
    expect(mocks.verify).toHaveBeenCalledWith(expect.objectContaining({ dataId: "991" }));
    expect(mocks.getPayment).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("consulta o recurso do gateway e encaminha um identificador de evento estável para processamento idempotente", async () => {
    const res = response();
    const payload = { id: "evt-44", type: "payment", action: "payment.updated", data: { id: "991" } };
    await mercadoPagoWebhook(request(payload, { "x-signature": "ok", "x-request-id": "req-44" }), res);
    expect(mocks.getPayment).toHaveBeenCalledWith("991");
    expect(mocks.applyPayment).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt-44" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
