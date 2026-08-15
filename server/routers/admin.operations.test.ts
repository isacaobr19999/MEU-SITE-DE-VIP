import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mocks = vi.hoisted(() => ({
  cancelOrderRecord: vi.fn(),
  retryDeliveryRecord: vi.fn(),
  setAdminRole: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("../db/adminCatalog", () => ({
  createCategoryRecord: vi.fn(),
  createProductRecord: vi.fn(),
  listAdminCategories: vi.fn(),
}));

vi.mock("../db/admin", () => ({
  cancelOrderRecord: mocks.cancelOrderRecord,
  createCouponRecord: vi.fn(),
  createServerRecord: vi.fn(),
  getAdminOrderDetail: vi.fn(),
  getAdminOverview: vi.fn(),
  listAdminCoupons: vi.fn(),
  listAdminDeliveries: vi.fn(),
  listAdminLogs: vi.fn(),
  listAdminOrders: vi.fn(),
  listAdminPlayers: vi.fn(),
  listAdminProducts: vi.fn(),
  listAdminServers: vi.fn(),
  listAdminUsers: vi.fn(),
  listPlayerHistory: vi.fn(),
  retryDeliveryRecord: mocks.retryDeliveryRecord,
  setAdminRole: mocks.setAdminRole,
  setProductStatus: vi.fn(),
  updateCategoryRecord: vi.fn(),
  updateCouponRecord: vi.fn(),
  updateProductRecord: vi.fn(),
  updateServerRecord: vi.fn(),
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

import { adminRouter } from "./admin";

function adminContext(id = 42): TrpcContext {
  return {
    user: { id, openId: `admin-${id}`, name: "Admin", email: "admin@example.com", loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operações administrativas críticas", () => {
  it("cancela somente pelo fluxo administrativo e registra a auditoria", async () => {
    mocks.cancelOrderRecord.mockResolvedValue(undefined);
    mocks.writeAdminAuditLog.mockResolvedValue(undefined);
    const orderId = "00000000-0000-4000-8000-000000000123";

    await expect(adminRouter.createCaller(adminContext()).cancelOrder({ id: orderId })).resolves.toEqual({ success: true });
    expect(mocks.cancelOrderRecord).toHaveBeenCalledWith(orderId);
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith("admin-42", "order.cancelled", "order", orderId, undefined);
  });

  it("converte falha de cancelamento em erro de negócio seguro", async () => {
    mocks.cancelOrderRecord.mockRejectedValue(new Error("Pedido já processado"));
    const orderId = "00000000-0000-4000-8000-000000000124";

    await expect(adminRouter.createCaller(adminContext()).cancelOrder({ id: orderId })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Pedido já processado" });
  });

  it("recoloca uma entrega na fila e registra a auditoria", async () => {
    mocks.retryDeliveryRecord.mockResolvedValue(undefined);
    mocks.writeAdminAuditLog.mockResolvedValue(undefined);
    const deliveryId = "00000000-0000-4000-8000-000000000125";

    await expect(adminRouter.createCaller(adminContext()).retryDelivery({ id: deliveryId })).resolves.toEqual({ success: true });
    expect(mocks.retryDeliveryRecord).toHaveBeenCalledWith(deliveryId);
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith("admin-42", "delivery.retried", "delivery", deliveryId, undefined);
  });

  it("impede que o administrador remova sua própria permissão", async () => {
    await expect(adminRouter.createCaller(adminContext(77)).setUserRole({ userId: 77, role: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.setAdminRole).not.toHaveBeenCalled();
  });

  it("atualiza a função de outra conta e cria a trilha de auditoria", async () => {
    mocks.setAdminRole.mockResolvedValue(undefined);
    mocks.writeAdminAuditLog.mockResolvedValue(undefined);

    await expect(adminRouter.createCaller(adminContext()).setUserRole({ userId: 88, role: "admin" })).resolves.toEqual({ success: true });
    expect(mocks.setAdminRole).toHaveBeenCalledWith(88, "admin");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith("admin-42", "user.role_changed", "user", "88", { role: "admin" });
  });
});
