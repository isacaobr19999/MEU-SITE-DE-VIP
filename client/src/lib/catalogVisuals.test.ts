import { describe, expect, it } from "vitest";
import { getBestVipValue, getCatalogVisual, getVipBenefits, getVipPreview } from "./catalogVisuals";

describe("catalogVisuals", () => {
  it("associa os tipos e nomes de categoria às ilustrações apropriadas", () => {
    expect(getCatalogVisual({ kind: "VIP", categoryName: "VIP" }).label).toBe("VIP");
    expect(getCatalogVisual({ kind: "COINS", categoryName: "Cash" }).label).toBe("Cash");
    expect(getCatalogVisual({ kind: "KIT", categoryName: "Booster" }).label).toBe("Booster");
    expect(getCatalogVisual({ kind: "VIP", categoryName: "VIP" }).fallbackUrl).toContain("MaterialDesign-SVG");
  });

  it("mostra somente o texto já cadastrado como prévia de VIP", () => {
    expect(getVipPreview({ shortDescription: "  Acesso a comandos especiais.  " })).toBe("Acesso a comandos especiais.");
    expect(getVipPreview({ description: "Benefícios oficiais" })).toBe("Benefícios oficiais");
    expect(getVipPreview({})).toBeNull();
    expect(getVipPreview({ kind: "VIP", shortDescription: "VIP Ferro por 30 dias.", description: "Acesso ao grupo VIP Ferro durante 30 dias." })).toBe("Acesso ao grupo VIP Ferro durante 30 dias.");
  });

  it("separa detalhes existentes para a comparação sem criar benefícios", () => {
    expect(getVipBenefits({ description: "Acesso ao chat VIP.\n• Kit semanal; Tag exclusiva" })).toEqual(["Acesso ao chat VIP.", "Kit semanal", "Tag exclusiva"]);
    expect(getVipBenefits({ description: "Acesso ao grupo VIP Ferro durante 30 dias." })).toEqual(["Grupo incluído: VIP Ferro.", "Duração: 30 dias."]);
    expect(getVipBenefits({})).toEqual([]);
  });

  it("identifica apenas o VIP com menor custo diário dentre durações cadastradas", () => {
    expect(getBestVipValue([{ id: 1, priceCents: 3000, durationDays: 30 }, { id: 2, priceCents: 5000, durationDays: 90 }, { id: 3, priceCents: 1000, durationDays: null }])?.id).toBe(2);
    expect(getBestVipValue([{ id: 4, priceCents: 1000, durationDays: null }])).toBeUndefined();
  });
});
