import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readPluginFile = (relativePath: string) => readFileSync(new URL(`../minecraft-plugin/${relativePath}`, import.meta.url), "utf8");

describe("integração opcional do LuckPerms no plugin Paper", () => {
  it("não exige as classes da API LuckPerms para habilitar o plugin", () => {
    const plugin = readPluginFile("src/main/java/com/playstorcraft/paper/PlayStorCraftPlugin.java");
    const poller = readPluginFile("src/main/java/com/playstorcraft/paper/DeliveryPoller.java");
    const build = readPluginFile("build.gradle.kts");

    expect(plugin).toContain('getPlugin("LuckPerms")');
    expect(plugin).not.toContain("import net.luckperms.api");
    expect(poller).not.toContain("import net.luckperms.api");
    expect(build).not.toContain("net.luckperms:api");
  });
});
