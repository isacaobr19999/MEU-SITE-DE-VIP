import { describe, expect, it } from "vitest";
import { buildAdminOrdersCsv } from "./adminOrdersCsv";

describe("exportação CSV administrativa", () => {
  it("preserva o cabeçalho, formato brasileiro e neutraliza fórmulas de planilha", () => {
    const csv = buildAdminOrdersCsv([{ orderNumber: "=PSC-001", status: "PAID", playerName: "+Jogador", playerUuid: "uuid-1", couponCode: "@PROMO", discountCents: 150, totalCents: 490, createdAt: "2026-08-18T12:00:00.000Z", paidAt: null }]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"\'=PSC-001"');
    expect(csv).toContain('"\'+Jogador"');
    expect(csv).toContain('"\'@PROMO"');
    expect(csv).toContain('"1,50"');
    expect(csv).toContain('"4,90"');
  });
});
