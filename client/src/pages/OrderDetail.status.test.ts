import { describe, expect, it } from "vitest";
import { getOrderStatusMessage } from "./OrderDetail";

describe("mensagens de acompanhamento de pedido", () => {
  it("não sugere entrega pendente quando o pagamento foi recusado", () => {
    expect(getOrderStatusMessage("FAILED")).toEqual({ tone: "rose", message: "O pagamento não foi aprovado. Nenhuma entrega foi liberada para este pedido." });
  });

  it("informa entrega concluída somente para pedido concluído", () => {
    expect(getOrderStatusMessage("COMPLETED")).toEqual({ tone: "emerald", message: "O pagamento foi confirmado e a entrega foi concluída pelo servidor." });
  });
});
