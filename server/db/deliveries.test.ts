import { describe, expect, it } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireDb: vi.fn(),
  verifySecret: vi.fn(),
  updateWhere: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../db", () => ({ requireDb: mocks.requireDb }));
vi.mock("../services/secretHash", () => ({ hashSecret: vi.fn(), verifySecret: mocks.verifySecret }));

import { completeClaimedDelivery, deferClaimedDelivery, deliveryIdempotencyKey, expandDeliveryCommand, failClaimedDelivery } from "./deliveries";

const claimedDelivery = {
  id: "delivery-1",
  serverId: 1,
  status: "CLAIMED",
  claimTokenHash: "hash",
  claimExpiresAt: new Date(Date.now() + 60_000),
  attemptCount: 1,
  maxAttempts: 3,
  orderItemId: 2,
  playerId: 3,
  orderId: "order-1",
};

function setupClaimedDb() {
  const chain = { limit: vi.fn().mockResolvedValue([claimedDelivery]) };
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => chain) })) }));
  const db = {
    select,
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: mocks.updateWhere })) })),
    transaction: mocks.transaction,
  };
  mocks.requireDb.mockResolvedValue(db);
  return db;
}

describe("fila de entregas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MINECRAFT_API_KEY_PEPPER = "pepper-de-teste";
    mocks.verifySecret.mockResolvedValue(true);
    mocks.updateWhere.mockResolvedValue([{ affectedRows: 1 }]);
  });

  it("substitui apenas os placeholders permitidos no comando de entrega", () => {
    expect(expandDeliveryCommand("lp user {player} parent add {product} {duration}d em {server} para {uuid}", { player: "Alex", uuid: "00000000-0000-0000-0000-000000000001", product: "vip", server: "SURVIVAL", duration: "30" })).toBe("lp user Alex parent add vip 30d em SURVIVAL para 00000000-0000-0000-0000-000000000001");
  });

  it("produz a mesma chave para a mesma entrega, permitindo inserção idempotente", () => {
    expect(deliveryIdempotencyKey("00000000-0000-0000-0000-000000000001", 42)).toBe("delivery:00000000-0000-0000-0000-000000000001:42");
  });

  it("adia uma entrega de jogador offline sem consumir tentativa", async () => {
    const db = setupClaimedDb();
    await deferClaimedDelivery(1, "delivery-1", "token");
    expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalled();
  });

  it("reagenda uma falha recuperável com incremento de tentativa", async () => {
    setupClaimedDb();
    await failClaimedDelivery(1, "delivery-1", "token", "falha transitória");
    expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
  });

  it("não duplica efeitos de uma conclusão que já foi confirmada por outra execução", async () => {
    const db = setupClaimedDb();
    const tx = {
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ affectedRows: 0 }]) })) })),
      select: vi.fn(),
      insert: vi.fn(),
    };
    db.transaction.mockImplementation(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx));
    await completeClaimedDelivery(1, "delivery-1", "token");
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
