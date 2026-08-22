import { describe, expect, it, vi } from "vitest";
import { createLinkCodeHandler, redeemDiscordLinkCodeHandler } from "./legacyLinks";

function responseMock() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

function requestMock(headers: Record<string, string>, body: unknown) {
  return { header: (name: string) => headers[name.toLowerCase()], body } as never;
}

describe("legacy link routes", () => {
  it("rejects missing integration credentials before touching the database", async () => {
    const response = responseMock();
    await createLinkCodeHandler(requestMock({}, {}), response as never);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ linked: false, created: false, error: "UNAUTHORIZED" });
  });

  it("rejects malformed redeem payload with a valid integration credential", async () => {
    const previous = process.env.INTEGRATION_API_KEY;
    process.env.INTEGRATION_API_KEY = "unit-test-integration-key";
    const response = responseMock();
    await redeemDiscordLinkCodeHandler(requestMock({ "x-integration-key": "unit-test-integration-key" }, { code: "not-a-code" }), response as never);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ linked: false, error: "INVALID_LINK_REQUEST" });
    if (previous === undefined) delete process.env.INTEGRATION_API_KEY;
    else process.env.INTEGRATION_API_KEY = previous;
  });
});
