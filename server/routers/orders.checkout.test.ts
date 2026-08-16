import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mocks = vi.hoisted(() => ({
  completeComplimentaryOrderForUser: vi.fn(),
  createMercadoPagoPreference: vi.fn(),
  getCheckoutOrderForUser: vi.fn(),
  getSavedCheckout: vi.fn(),
  saveCheckoutPreference: vi.fn(),
}));

vi.mock("../db/orders", () => ({
  createOrderForUser: vi.fn(),
  getOrderForUser: vi.fn(),
  listOrdersForUser: vi.fn(),
}));

vi.mock("../db/payments", () => ({
  completeComplimentaryOrderForUser: mocks.completeComplimentaryOrderForUser,
  getCheckoutOrderForUser: mocks.getCheckoutOrderForUser,
  getSavedCheckout: mocks.getSavedCheckout,
  saveCheckoutPreference: mocks.saveCheckoutPreference,
}));

vi.mock("../services/mercadoPago", () => ({ createMercadoPagoPreference: mocks.createMercadoPagoPreference }));

import { ordersRouter } from "./orders";

const orderId = "00000000-0000-4000-8000-000000000501";

function context(): TrpcContext {
  return {
    user: { id: 42, openId: "customer-42", name: "Cliente", email: "cliente@example.com", loginMethod: "local", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("checkout com cupom", () => {
  it("finaliza pedido totalmente descontado sem enviar unit_price zero ao Mercado Pago", async () => {
    mocks.getCheckoutOrderForUser.mockResolvedValue({ order: { id: orderId, status: "WAITING_PAYMENT", totalCents: 0 }, items: [] });
    mocks.completeComplimentaryOrderForUser.mockResolvedValue({ preferenceId: `coupon-${orderId}`, checkoutUrl: `/orders/${orderId}`, complimentary: true });

    await expect(ordersRouter.createCaller(context()).checkout({ orderId })).resolves.toEqual({ preferenceId: `coupon-${orderId}`, checkoutUrl: `/orders/${orderId}`, complimentary: true });
    expect(mocks.completeComplimentaryOrderForUser).toHaveBeenCalledWith(42, orderId);
    expect(mocks.createMercadoPagoPreference).not.toHaveBeenCalled();
  });

  it("envia ao gateway apenas o total final quando o pedido ainda possui valor a pagar", async () => {
    mocks.getCheckoutOrderForUser.mockResolvedValue({ order: { id: orderId, orderNumber: "PSC-TESTE", status: "WAITING_PAYMENT", totalCents: 2691 }, items: [{ productId: 2, productName: "VIP Ouro", quantity: 1, unitPriceCents: 2990 }] });
    mocks.getSavedCheckout.mockResolvedValue(undefined);
    mocks.createMercadoPagoPreference.mockResolvedValue({ preferenceId: "preference-1", checkoutUrl: "https://checkout.example" });

    await expect(ordersRouter.createCaller(context()).checkout({ orderId })).resolves.toEqual({ preferenceId: "preference-1", checkoutUrl: "https://checkout.example", complimentary: false });
    expect(mocks.createMercadoPagoPreference).toHaveBeenCalledWith({ orderId, orderNumber: "PSC-TESTE", totalCents: 2691, items: [{ productId: 2, productName: "VIP Ouro", quantity: 1, unitPriceCents: 2990 }] });
  });
});
