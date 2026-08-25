import { describe, expect, it } from "vitest";
import { copyCodeButton, linkCodeMessage, linkSuccessMessage } from "./linkMessages.mjs";

describe("mensagens de vínculo Discord", () => {
  it("informa sucesso com jogador e orientação de desvinculação", () => {
    expect(linkSuccessMessage("_Nube")).toContain("_Nube");
    expect(linkSuccessMessage("_Nube")).toContain("Vínculo concluído com sucesso");
    expect(linkSuccessMessage("_Nube")).toContain("/unlink");
  });

  it("destaca o código e o prazo de expiração", () => {
    expect(linkCodeMessage("123456")).toContain("123456");
    expect(linkCodeMessage("123456")).toContain("10 minutos");
  });

  it("cria um botão de cópia associado somente a código de seis dígitos", () => {
    const row = copyCodeButton("123456").toJSON();
    expect(row.components[0].custom_id).toBe("legacy-link:copy:123456");
    expect(row.components[0].label).toBe("Copiar código");
  });
});
