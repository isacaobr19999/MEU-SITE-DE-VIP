import { describe, expect, it } from "vitest";
import { integrationHealthHandler } from "./legacyHealth";

describe("legacy integration health", () => {
  it("accepts the configured integration key and rejects missing credentials", async () => {
    const expected = process.env.INTEGRATION_API_KEY;
    expect(expected).toBeTruthy();

    const response = await invoke({ "x-integration-key": expected });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, service: "minecraft-discord-platform" });

    const unauthorized = await invoke({});
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body).toEqual({ ok: false, error: "UNAUTHORIZED" });
  });
});

async function invoke(headers: Record<string, string>) {
  let status = 200;
  let body: unknown;
  const req = { header: (name: string) => headers[name.toLowerCase()] } as never;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as never;
  await integrationHealthHandler(req, res);
  return { status, body };
}

