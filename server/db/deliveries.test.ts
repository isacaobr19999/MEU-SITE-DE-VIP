import { describe, expect, it } from "vitest";
import { deliveryIdempotencyKey, expandDeliveryCommand } from "./deliveries";

describe("fila de entregas", () => {
  it("substitui apenas os placeholders permitidos no comando de entrega", () => {
    expect(expandDeliveryCommand("lp user {player} parent add {product} {duration}d em {server} para {uuid}", { player: "Alex", uuid: "00000000-0000-0000-0000-000000000001", product: "vip", server: "SURVIVAL", duration: "30" })).toBe("lp user Alex parent add vip 30d em SURVIVAL para 00000000-0000-0000-0000-000000000001");
  });

  it("produz a mesma chave para a mesma entrega, permitindo inserção idempotente", () => {
    expect(deliveryIdempotencyKey("00000000-0000-0000-0000-000000000001", 42)).toBe("delivery:00000000-0000-0000-0000-000000000001:42");
  });
});
