import { describe, expect, it } from "vitest";

describe("token do bot Discord", () => {
  const itWithToken = process.env.DISCORD_BOT_TOKEN ? it : it.skip;

  itWithToken("autentica na consulta leve de identidade do bot", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    expect(token).toBeTruthy();

    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });

    expect(response.ok).toBe(true);
    const body = await response.json() as { bot?: boolean; id?: string };
    expect(body.bot).toBe(true);
    expect(body.id).toBeTruthy();
  }, 20_000);
});
