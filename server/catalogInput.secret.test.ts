import { describe, expect, it } from "vitest";

describe("configuração de catálogo", () => {
  it("alcança o endpoint leve de saúde sem expor o conteúdo", async () => {
    const catalogInput = process.env.PLAYSTORCRAFT_CATALOG_INPUT ?? "";
    const response = await fetch("http://127.0.0.1:3000/", {
      headers: { "X-PlayStorCraft-Catalog-Input": catalogInput },
    });
    expect(response.ok).toBe(true);
    expect(catalogInput).toEqual(expect.any(String));
  });
});
