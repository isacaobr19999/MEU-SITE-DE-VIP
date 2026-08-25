import { describe, expect, it, vi } from "vitest";
import { ADMIN_THEME_EVENT, ADMIN_THEME_STORAGE_KEY, parseAdminTheme, persistAdminTheme, type AdminTheme } from "./adminTheme";

describe("adminTheme", () => {
  it("aceita somente o modo claro persistido", () => {
    expect(parseAdminTheme("light")).toBe("light");
  });

  it("mantém o modo escuro como padrão seguro", () => {
    expect(parseAdminTheme("dark")).toBe("dark");
    expect(parseAdminTheme("invalido")).toBe("dark");
    expect(parseAdminTheme(null)).toBe("dark");
  });

  it("persiste o tema e notifica o layout administrativo", () => {
    const values = new Map<string, string>();
    const dispatchEvent = vi.fn();
    const storage = {
      setItem: (key: string, value: string) => values.set(key, value),
      getItem: (key: string) => values.get(key) ?? null,
    };
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage, dispatchEvent });

    persistAdminTheme("light");

    expect(values.get(ADMIN_THEME_STORAGE_KEY)).toBe("light");
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect((dispatchEvent.mock.calls[0]?.[0] as CustomEvent<AdminTheme>).type).toBe(ADMIN_THEME_EVENT);
    expect((dispatchEvent.mock.calls[0]?.[0] as CustomEvent<AdminTheme>).detail).toBe("light");

    vi.unstubAllGlobals();
  });
});

