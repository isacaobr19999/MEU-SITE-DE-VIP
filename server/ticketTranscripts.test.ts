import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authorized: vi.fn(), record: vi.fn() }));

vi.mock("./community", () => ({ isDiscordBridgeAuthorized: mocks.authorized }));
vi.mock("./db/ticketTranscripts", () => ({ recordTicketTranscripts: mocks.record }));

import { recordTicketTranscriptsRoute } from "./ticketTranscripts";

function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("ponte de metadados de transcrições", () => {
  it("recusa uma chamada sem o segredo da ponte Discord", async () => {
    mocks.authorized.mockReturnValue(false);
    const res = response();
    await recordTicketTranscriptsRoute({ header: vi.fn() } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("registra apenas identificador e data de encerramento de uma transcrição válida", async () => {
    mocks.authorized.mockReturnValue(true);
    mocks.record.mockResolvedValue(1);
    const res = response();
    await recordTicketTranscriptsRoute({ header: vi.fn().mockReturnValue("segredo"), body: { transcripts: [{ messageId: "154020210817788321", closedAt: "2026-08-21T05:00:00.000Z" }] } } as never, res as never);
    expect(mocks.record).toHaveBeenCalledWith([{ messageId: "154020210817788321", closedAt: new Date("2026-08-21T05:00:00.000Z") }]);
    expect(res.json).toHaveBeenCalledWith({ recorded: 1 });
  });
});
