import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireDb: vi.fn() }));

vi.mock("../db", () => ({ requireDb: mocks.requireDb }));

import { listAdminCategories } from "./adminCatalog";
import { listAdminCoupons, listAdminProducts, listAdminServers } from "./admin";

describe("consulta de categorias administrativas", () => {
  beforeEach(() => vi.resetAllMocks());

  it("preserva os campos editáveis, incluindo imageUrl, para o formulário administrativo", async () => {
    const rows = [{ id: 7, name: "VIPs", slug: "vips", description: "Benefícios", imageUrl: "https://cdn.example.com/vips.png", position: 3, active: true }];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const from = vi.fn().mockReturnValue({ orderBy });
    mocks.requireDb.mockResolvedValue({ select: vi.fn().mockReturnValue({ from }) });

    await expect(listAdminCategories()).resolves.toEqual(rows);
    expect(orderBy).toHaveBeenCalledOnce();
  });

  it("retorna produto com conteúdo editável e todos os destinos vinculados", async () => {
    const productRows = [{ id: 4, categoryId: 2, name: "VIP Mestre", slug: "vip-mestre", shortDescription: "Curta", description: "Completa", imageUrl: "https://cdn.example.com/vip.png", priceCents: 5000, kind: "VIP", durationDays: 30, luckPermsGroup: "mestre", deliveryCommands: ["lp user {player} parent add mestre"], active: true, featured: true, categoryName: "VIPs", position: 1 }];
    const assignments = [{ productId: 4, serverId: 10 }, { productId: 4, serverId: 11 }];
    const productOrderBy = vi.fn().mockResolvedValue(productRows);
    const productFrom = vi.fn().mockReturnValue({ innerJoin: vi.fn().mockReturnValue({ orderBy: productOrderBy }) });
    const assignmentFrom = vi.fn().mockResolvedValue(assignments);
    mocks.requireDb.mockResolvedValue({ select: vi.fn().mockReturnValueOnce({ from: productFrom }).mockReturnValueOnce({ from: assignmentFrom }) });

    await expect(listAdminProducts()).resolves.toEqual([{ ...productRows[0], serverIds: [10, 11] }]);
  });

  it("retorna os campos editáveis do servidor e mascara a chave de integração", async () => {
    const rows = [{ id: 10, name: "Survival", slug: "survival", kind: "SURVIVAL", active: true, apiKeyLastFour: "ab12", createdAt: new Date() }];
    const orderBy = vi.fn().mockResolvedValue(rows);
    mocks.requireDb.mockResolvedValue({ select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ orderBy }) }) });

    await expect(listAdminServers()).resolves.toEqual(rows);
    expect(rows[0]).not.toHaveProperty("apiKeyHash");
  });

  it("retorna cupom com descrição, regras e a relação de produtos aplicáveis", async () => {
    const couponRows = [{ id: 9, code: "MESTRE10", description: "Campanha", type: "PERCENTAGE", percentageBasisPoints: 1000, fixedDiscountCents: null, startsAt: null, endsAt: null, maxUses: 20, maxUsesPerPlayer: 1, active: true }];
    const assignments = [{ couponId: 9, productId: 4 }];
    const couponOrderBy = vi.fn().mockResolvedValue(couponRows);
    const couponWhere = vi.fn().mockReturnValue({ orderBy: couponOrderBy });
    const couponFrom = vi.fn().mockReturnValue({ where: couponWhere });
    const assignmentFrom = vi.fn().mockResolvedValue(assignments);
    mocks.requireDb.mockResolvedValue({ select: vi.fn().mockReturnValueOnce({ from: couponFrom }).mockReturnValueOnce({ from: assignmentFrom }) });

    await expect(listAdminCoupons()).resolves.toEqual([{ ...couponRows[0], productIds: [4] }]);
    expect(couponWhere).toHaveBeenCalledOnce();
  });
});
