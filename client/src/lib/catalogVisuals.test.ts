import { describe, expect, it } from "vitest";
import { getCatalogVisual, getVipBenefits, getVipPreview } from "./catalogVisuals";

describe("catalogVisuals", () => {
  it("associa os tipos e nomes de categoria às ilustrações apropriadas", () => {
    expect(getCatalogVisual({ kind: "VIP", categoryName: "VIP" }).label).toBe("VIP");
    expect(getCatalogVisual({ kind: "COINS", categoryName: "Cash" }).label).toBe("Cash");
    expect(getCatalogVisual({ kind: "KIT", categoryName: "Booster" }).label).toBe("Booster");
  });

  it("mostra somente o texto já cadastrado como prévia de VIP", () => {
    expect(getVipPreview({ shortDescription: "  Acesso a comandos especiais.  " })).toBe("Acesso a comandos especiais.");
    expect(getVipPreview({ description: "Benefícios oficiais" })).toBe("Benefícios oficiais");
    expect(getVipPreview({})).toBeNull();
  });

  it("separa detalhes existentes para a comparação sem criar benefícios", () => {
    expect(getVipBenefits({ description: "Acesso ao chat VIP.\n• Kit semanal; Tag exclusiva" })).toEqual(["Acesso ao chat VIP.", "Kit semanal", "Tag exclusiva"]);
    expect(getVipBenefits({})).toEqual([]);
  });
});
