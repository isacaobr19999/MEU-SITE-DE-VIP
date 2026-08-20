import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCategoryRecord, createProductRecord, listAdminCategories } from "../db/adminCatalog";
import { cancelOrderRecord, createCouponRecord, createServerRecord, deleteCouponRecord, getAdminMonthlySales, getAdminOrderDetail, getAdminOverview, getAdminProductPriceCents, listAdminCoupons, listAdminDeliveries, listAdminLogs, listAdminOrderExport, listAdminOrders, listAdminPlayers, listAdminProducts, listAdminServers, listAdminUsers, listPlayerHistory, retryDeliveryRecord, setAdminRole, setProductStatus, updateCategoryRecord, updateCouponRecord, updateProductRecord, updateServerRecord, writeAdminAuditLog } from "../db/admin";
import { getStoreAvailability, setStoreAvailability } from "../db/storeSettings";
import { adminProcedure, router } from "../_core/trpc";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(3).max(160);
export const adminMediaUrl = z.string().trim().max(1024).refine(value => (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\/[^\s]+$/i.test(value), { message: "Informe uma URL HTTPS/HTTP ou um caminho relativo iniciado por /." });
export const adminDurationDays = z.number().int().min(1).max(3650);
const productInput = z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(160), slug, kind: z.enum(["VIP", "COINS", "KIT", "COSMETIC"]), priceCents: z.number().int().min(1).max(100_000_000), durationDays: adminDurationDays.nullable().optional(), luckPermsGroup: z.string().trim().max(96).optional(), deliveryCommands: z.array(z.string().trim().min(1).max(255)).max(16).default([]), featured: z.boolean().default(false), serverIds: z.array(z.number().int().positive()).min(1).max(16) }).superRefine((value, issue) => {
  if (!value.deliveryCommands.length && !value.luckPermsGroup) issue.addIssue({ code: "custom", path: ["deliveryCommands"], message: "Informe um comando de entrega ou um grupo LuckPerms." });
});
export const adminProductUpdatePriceCents = z.number().int().min(0).max(100_000_000);
const productUpdateInput = productInput.safeExtend({ priceCents: adminProductUpdatePriceCents });
const productContentInput = z.object({ shortDescription: z.string().trim().max(280).optional(), description: z.string().trim().max(8000).optional(), imageUrl: adminMediaUrl.optional(), position: z.number().int().min(0).max(9999).default(0) });
const couponInput = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).min(3).max(48), description: z.string().trim().max(280).optional(), type: z.enum(["PERCENTAGE", "FIXED"]), percentageBasisPoints: z.number().int().min(1).max(10_000).optional(), fixedDiscountCents: z.number().int().min(1).max(100_000_000).optional(), startsAt: z.date().nullable().optional(), endsAt: z.date().nullable().optional(), maxUses: z.number().int().min(1).nullable().optional(), maxUsesPerPlayer: z.number().int().min(1).max(100).default(1), active: z.boolean().default(true), productIds: z.array(z.number().int().positive()).optional() }).superRefine((value, issue) => { if (value.type === "PERCENTAGE" && !value.percentageBasisPoints) issue.addIssue({ code: "custom", message: "Informe o percentual de desconto", path: ["percentageBasisPoints"] }); if (value.type === "FIXED" && !value.fixedDiscountCents) issue.addIssue({ code: "custom", message: "Informe o valor fixo de desconto", path: ["fixedDiscountCents"] }); if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) issue.addIssue({ code: "custom", message: "A expiração deve ocorrer depois do início do cupom.", path: ["endsAt"] }); });

function audit(ctx: { user: { openId: string } }, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  return writeAdminAuditLog(ctx.user.openId, action, entityType, entityId, metadata).catch(() => undefined);
}

export const adminRouter = router({
  overview: adminProcedure.query(getAdminOverview),

  monthlySales: adminProcedure.query(() => getAdminMonthlySales()),

  exportOrders: adminProcedure.query(async ({ ctx }) => {
    const rows = await listAdminOrderExport();
    await audit(ctx, "orders.exported", "order_export", undefined, { rowCount: rows.length });
    return rows;
  }),

  categories: adminProcedure.query(listAdminCategories),
  products: adminProcedure.query(listAdminProducts),
  orders: adminProcedure.query(listAdminOrders),
  orderDetail: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const order = await getAdminOrderDetail(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não localizado" });
    return order;
  }),
  players: adminProcedure.query(listAdminPlayers),
  playerHistory: adminProcedure.input(z.object({ playerId: z.number().int().positive() })).query(({ input }) => listPlayerHistory(input.playerId)),
  deliveries: adminProcedure.query(listAdminDeliveries),
  servers: adminProcedure.query(listAdminServers),
  coupons: adminProcedure.query(listAdminCoupons),
  logs: adminProcedure.query(listAdminLogs),
  users: adminProcedure.query(listAdminUsers),
  storeAvailability: adminProcedure.query(getStoreAvailability),
  setStoreAvailability: adminProcedure.input(z.object({ publicOnline: z.boolean(), offlineMessage: z.string().trim().min(8).max(280).optional() })).mutation(async ({ ctx, input }) => {
    const settings = await setStoreAvailability(input);
    await audit(ctx, input.publicOnline ? "store.activated" : "store.deactivated", "store_settings", "1", { publicOnline: input.publicOnline });
    return settings;
  }),
  createCategory: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(96), slug: slug.max(96), description: z.string().trim().max(2000).optional(), imageUrl: adminMediaUrl.optional(), position: z.number().int().min(0).max(9999).default(0) })).mutation(async ({ ctx, input }) => {
    const id = await createCategoryRecord(input);
    await audit(ctx, "category.created", "category", String(id), { name: input.name });
    return { id };
  }),
  updateCategory: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(96), slug: slug.max(96), description: z.string().trim().max(2000).optional(), imageUrl: adminMediaUrl.optional(), position: z.number().int().min(0).max(9999), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    await updateCategoryRecord(input.id, input);
    await audit(ctx, "category.updated", "category", String(input.id));
    return { success: true };
  }),
  createProduct: adminProcedure.input(productInput.safeExtend(productContentInput.shape)).mutation(async ({ ctx, input }) => {
    const id = await createProductRecord(input);
    await audit(ctx, "product.created", "product", String(id), { name: input.name });
    return { id };
  }),
  updateProduct: adminProcedure.input(productUpdateInput.safeExtend(productContentInput.shape).safeExtend({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    const previousPriceCents = input.priceCents === 0 ? await getAdminProductPriceCents(input.id) : undefined;
    if (input.priceCents === 0 && !previousPriceCents) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não localizado para preservar o preço existente." });
    const priceCents = input.priceCents === 0 ? previousPriceCents! : input.priceCents;
    await updateProductRecord(input.id, { ...input, priceCents });
    await audit(ctx, "product.updated", "product", String(input.id), { preservedPrice: input.priceCents === 0 });
    return { success: true };
  }),
  setProductStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    await setProductStatus(input.id, input.active);
    await audit(ctx, "product.status_changed", "product", String(input.id), { active: input.active });
    return { success: true };
  }),
  cancelOrder: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    try { await cancelOrderRecord(input.id); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível cancelar o pedido" }); }
    await audit(ctx, "order.cancelled", "order", input.id);
    return { success: true };
  }),
  retryDelivery: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    try { await retryDeliveryRecord(input.id); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível reprocessar a entrega" }); }
    await audit(ctx, "delivery.retried", "delivery", input.id);
    return { success: true };
  }),
  createCoupon: adminProcedure.input(couponInput).mutation(async ({ ctx, input }) => {
    try {
      const id = await createCouponRecord(input);
      await audit(ctx, "coupon.created", "coupon", String(id), { code: input.code });
      return { id };
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (code === "ER_DUP_ENTRY") throw new TRPCError({ code: "CONFLICT", message: "Já existe um cupom com esse código. Escolha outro código." });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar o cupom. Verifique os dados e tente novamente." });
    }
  }),
  updateCoupon: adminProcedure.input(couponInput.safeExtend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await updateCouponRecord(input.id, input);
    await audit(ctx, "coupon.updated", "coupon", String(input.id));
    return { success: true };
  }),
  deleteCoupon: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const result = await deleteCouponRecord(input.id);
      await audit(ctx, result.deactivated ? "coupon.deactivated" : "coupon.deleted", "coupon", String(input.id), { preservedHistory: result.deactivated });
      return { success: true, ...result };
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível excluir o cupom" });
    }
  }),
  createServer: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(96), slug: slug.max(48), kind: z.enum(["SURVIVAL", "SKYBLOCK", "BEDWARS", "GLOBAL"]) })).mutation(async ({ ctx, input }) => {
    const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
    if (!pepper) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A chave de proteção dos servidores ainda não foi configurada." });
    const result = await createServerRecord(input, pepper);
    await audit(ctx, "server.created", "server", String(result.id), { name: input.name });
    return result;
  }),
  updateServer: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(96), slug: slug.max(48), kind: z.enum(["SURVIVAL", "SKYBLOCK", "BEDWARS", "GLOBAL"]), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    await updateServerRecord(input.id, input);
    await audit(ctx, "server.updated", "server", String(input.id));
    return { success: true };
  }),
  setUserRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.id === input.userId && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover seu próprio acesso administrativo." });
    await setAdminRole(input.userId, input.role);
    await audit(ctx, "user.role_changed", "user", String(input.userId), { role: input.role });
    return { success: true };
  }),
});
