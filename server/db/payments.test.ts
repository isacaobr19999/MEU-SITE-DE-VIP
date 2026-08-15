import { describe, expect, it } from "vitest";
import { mapMercadoPagoMethod, mapMercadoPagoStatus } from "./payments";

describe("sincronização de pagamentos Mercado Pago", () => {
  it("mapeia somente pagamento aprovado para pedido pago", () => {
    expect(mapMercadoPagoStatus("approved")).toEqual({ paymentStatus: "APPROVED", orderStatus: "PAID" });
    expect(mapMercadoPagoStatus("pending")).toEqual({ paymentStatus: "PENDING", orderStatus: "WAITING_PAYMENT" });
    expect(mapMercadoPagoStatus("rejected")).toEqual({ paymentStatus: "REJECTED", orderStatus: "FAILED" });
    expect(mapMercadoPagoStatus("refunded")).toEqual({ paymentStatus: "REFUNDED", orderStatus: "REFUNDED" });
  });

  it("classifica métodos de PIX e cartão sem confiar no frontend", () => {
    expect(mapMercadoPagoMethod("pix")).toBe("PIX");
    expect(mapMercadoPagoMethod("credit_card")).toBe("CARD");
    expect(mapMercadoPagoMethod("ticket")).toBe("OTHER");
  });
});
