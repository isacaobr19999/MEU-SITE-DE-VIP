import { describe, expect, it } from "vitest";
import { communityStatusInput, isDiscordBridgeAuthorized } from "./community";

describe("ponte Discord", () => {
  it("aceita uma atualização pública do bot com dados do Discord e do Paper", () => {
    const parsed = communityStatusInput.parse({
      discord: { guildId: "123456789012345678", name: "Comunidade PlayStorCraft", inviteUrl: "https://discord.gg/playstorcraft", memberCount: 120, onlineCount: 24 },
      minecraft: { status: "ONLINE", playersOnline: 8, playersMax: 100, version: "Paper 1.21.x" },
    });
    expect(parsed.minecraft.status).toBe("ONLINE");
    expect(parsed.discord.online).toBe(true);
  });

  it("rejeita segredos ausentes, diferentes ou com tamanho incompatível", () => {
    expect(isDiscordBridgeAuthorized(undefined, "segredo-seguro")).toBe(false);
    expect(isDiscordBridgeAuthorized("outro", "segredo-seguro")).toBe(false);
    expect(isDiscordBridgeAuthorized("segredo-seguro", "segredo-seguro")).toBe(true);
  });
});
