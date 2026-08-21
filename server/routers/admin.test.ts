import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { adminDurationDays, adminMediaUrl, adminProductUpdatePriceCents } from "./admin";
import type { TrpcContext } from "../_core/context";

function userContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "non-admin-user",
      name: "User",
      email: "user@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("adminRouter", () => {
  it("recusa acesso ao painel para usuários sem função administrativa antes de consultar dados", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.admin.overview()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("protege métricas por período e busca global antes de consultar registros", async () => {
    const caller = appRouter.createCaller(userContext("user"));

    await expect(caller.admin.metricsByPeriod({ period: "30d" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.admin.ticketMetrics()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.admin.loginLockouts()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.admin.releaseLoginLockout({ emailHash: "a".repeat(64) })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.admin.search({ query: "PSC" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("protege a edição de produtos de usuários sem função administrativa", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.admin.updateProduct({
      id: 1,
      categoryId: 1,
      name: "VIP Teste",
      slug: "vip-teste",
      kind: "VIP",
      priceCents: 1000,
      durationDays: null,
      deliveryCommands: ["lp user {player} parent add vip"],
      featured: false,
      active: true,
      position: 0,
      serverIds: [1],
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("valida URLs de mídia antes de executar uma atualização de categoria", async () => {
    const caller = appRouter.createCaller(userContext("admin"));
    await expect(caller.admin.updateCategory({
      id: 1,
      name: "VIPs",
      slug: "vips",
      imageUrl: "arquivo-local-invalido",
      position: 0,
      active: true,
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
  });

  it("aceita caminhos relativos seguros e URLs HTTPS para imagens administrativas", () => {
    expect(adminMediaUrl.safeParse("/store-assets/vip_cash.webp").success).toBe(true);
    expect(adminMediaUrl.safeParse("https://cdn.example.com/vip.webp").success).toBe(true);
    expect(adminMediaUrl.safeParse("//cdn.example.com/vip.webp").success).toBe(false);
    expect(adminMediaUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("aceita durações comerciais inteiras, incluindo o Booster de 15 dias", () => {
    expect(adminDurationDays.safeParse(15).success).toBe(true);
    expect(adminDurationDays.safeParse(1).success).toBe(true);
    expect(adminDurationDays.safeParse(3650).success).toBe(true);
    expect(adminDurationDays.safeParse(0).success).toBe(false);
    expect(adminDurationDays.safeParse(1.5).success).toBe(false);
  });

  it("permite que a atualização preserve o preço existente quando o formulário envia zero por engano", () => {
    expect(adminProductUpdatePriceCents.safeParse(0).success).toBe(true);
    expect(adminProductUpdatePriceCents.safeParse(3990).success).toBe(true);
    expect(adminProductUpdatePriceCents.safeParse(-1).success).toBe(false);
  });
});
