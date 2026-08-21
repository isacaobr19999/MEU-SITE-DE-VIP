import { describe, expect, it } from "vitest";
import { parseAdminTheme } from "./adminTheme";

describe("adminTheme", () => {
  it("aceita somente o modo claro persistido", () => {
    expect(parseAdminTheme("light")).toBe("light");
  });

  it("mantém o modo escuro como padrão seguro", () => {
    expect(parseAdminTheme("dark")).toBe("dark");
    expect(parseAdminTheme("invalido")).toBe("dark");
    expect(parseAdminTheme(null)).toBe("dark");
  });
});
