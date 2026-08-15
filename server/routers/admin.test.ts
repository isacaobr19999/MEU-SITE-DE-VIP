import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
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
});
