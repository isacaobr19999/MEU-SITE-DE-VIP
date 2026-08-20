import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), process: vi.fn() }));

vi.mock("../_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticate } }));
vi.mock("../db/storeSettings", () => ({ processScheduledMaintenance: mocks.process }));

import { storeMaintenanceScheduler } from "./storeMaintenance";

function response() {
  const value = { status: vi.fn(), json: vi.fn() };
  value.status.mockReturnValue(value);
  return value;
}

describe("storeMaintenanceScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SELF_HOSTED;
  });

  it("processa apenas chamadas cron autenticadas pelo identificador persistido da tarefa", async () => {
    mocks.authenticate.mockResolvedValue({ isCron: true, taskUid: "cron-maintenance" });
    mocks.process.mockResolvedValue({ action: "started" });
    const res = response();

    await storeMaintenanceScheduler({ originalUrl: "/api/scheduled/store-maintenance", header: vi.fn() } as unknown as Parameters<typeof storeMaintenanceScheduler>[0], res as unknown as Parameters<typeof storeMaintenanceScheduler>[1]);

    expect(mocks.process).toHaveBeenCalledWith("cron-maintenance");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, action: "started", taskUid: "cron-maintenance" }));
  });

  it("recusa solicitações que não sejam executadas pelo agendador", async () => {
    mocks.authenticate.mockResolvedValue({ isCron: false });
    const res = response();

    await storeMaintenanceScheduler({ originalUrl: "/api/scheduled/store-maintenance", header: vi.fn() } as unknown as Parameters<typeof storeMaintenanceScheduler>[0], res as unknown as Parameters<typeof storeMaintenanceScheduler>[1]);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.process).not.toHaveBeenCalled();
  });
});
