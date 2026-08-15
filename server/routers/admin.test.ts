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
});
