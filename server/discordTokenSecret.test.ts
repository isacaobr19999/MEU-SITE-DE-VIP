import { describe, expect, it } from "vitest";

describe("token do bot Discord", () => {
  const itWithToken = process.env.DISCORD_BOT_TOKEN ? it : it.skip;

  itWithToken("está presente e tem o formato esperado para inicializar o bot", () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    expect(token).toBeTruthy();
    expect(token).toMatch(/^\S+\.\S+\.\S+$/);
    expect(token!.length).toBeGreaterThan(30);
  });
});
