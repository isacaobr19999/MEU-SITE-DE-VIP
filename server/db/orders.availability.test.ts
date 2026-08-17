import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("proteções de disponibilidade no checkout", () => {
  it("exige produto, categoria e destino de servidor ativos antes de criar pedidos", () => {
    const source = readFileSync(new URL("./orders.ts", import.meta.url), "utf8");

    expect(source).toContain("eq(products.active, true)");
    expect(source).toContain("eq(categories.active, true)");
    expect(source).toContain("innerJoin(servers, eq(productServers.serverId, servers.id))");
    expect(source).toContain("eq(servers.active, true)");
  });
});

