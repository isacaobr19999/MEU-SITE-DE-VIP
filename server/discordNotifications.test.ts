import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  mark: vi.fn(),
}));

vi.mock("./db/discordNotifications", () => ({
  listPendingDiscordNotifications: mocks.list,
  markDiscordNotificationsSent: mocks.mark,
}));

import { acknowledgeDiscordNotificationsRoute, listDiscordNotificationsRoute } from "./discordNotifications";

function response() {
  const values: { status?: number; body?: unknown } = {};
  return {
    values,
    status(code: number) { values.status = code; return this; },
    json(body: unknown) { values.body = body; return this; },
  };
}

describe("ponte de notificações Discord", () => {
  beforeEach(() => {
    process.env.DISCORD_BOT_BRIDGE_SECRET = "ponte-segura";
    mocks.list.mockReset();
    mocks.mark.mockReset();
  });

  it("entrega apenas a fila pendente ao bot autenticado", async () => {
    mocks.list.mockResolvedValue([{ id: "b6ad6a8a-7b2a-40ed-99d8-6d5cbbffda3f", eventType: "PAYMENT_APPROVED", payload: {}, createdAt: new Date() }]);
    const res = response();
    await listDiscordNotificationsRoute({ header: (name: string) => name === "x-playstor-discord-secret" ? "ponte-segura" : undefined, query: { limit: "5" } } as never, res as never);
    expect(mocks.list).toHaveBeenCalledWith(5);
    expect(res.values).toMatchObject({ body: { notifications: expect.any(Array) } });
  });

  it("recusa confirmações de uma ponte sem o segredo correto", async () => {
    const res = response();
    await acknowledgeDiscordNotificationsRoute({ header: () => "segredo-incorreto", body: { ids: ["b6ad6a8a-7b2a-40ed-99d8-6d5cbbffda3f"] } } as never, res as never);
    expect(mocks.mark).not.toHaveBeenCalled();
    expect(res.values).toMatchObject({ status: 401 });
  });
});
