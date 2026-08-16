import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCategoryRecord, createProductRecord, listAdminCategories } from "../db/adminCatalog";
import { cancelOrderRecord, createCouponRecord, createServerRecord, getAdminOrderDetail, getAdminOverview, listAdminCoupons, listAdminDeliveries, listAdminLogs, listAdminOrders, listAdminPlayers, listAdminProducts, listAdminServers, listAdminUsers, listPlayerHistory, retryDeliveryRecord, setAdminRole, setProductStatus, updateCategoryRecord, updateCouponRecord, updateProductRecord, updateServerRecord, writeAdminAuditLog } from "../db/admin";
import { adminProcedure, router } from "../_core/trpc";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(3).max(160);
export const adminMediaUrl = z.string().trim().max(1024).refine(value => (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\/[^\s]+$/i.test(value), { message: "Informe uma URL HTTPS/HTTP ou um caminho relativo iniciado por /." });
export const adminDurationDays = z.number().int().min(1).max(3650);
const productInput = z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(160), slug, kind: z.enum(["VIP", "COINS", "KIT", "COSMETIC"]), priceCents: z.number().int().min(1).max(100_000_000), durationDays: adminDurationDays.nullable().optional(), luckPermsGroup: z.string().trim().max(96).optional(), deliveryCommands: z.array(z.string().trim().min(1).max(255)).min(1).max(16), featured: z.boolean().default(false), serverIds: z.array(z.number().int().positive()).min(1).max(16) });
const productContentInput = z.object({ shortDescription: z.string().trim().max(280).optional(), description: z.string().trim().max(8000).optional(), imageUrl: adminMediaUrl.optional(), position: z.number().int().min(0).max(9999).default(0) });
const couponInput = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).min(3).max(48), description: z.string().trim().max(280).optional(), type: z.enum(["PERCENTAGE", "FIXED"]), percentageBasisPoints: z.number().int().min(1).max(10_000).optional(), fixedDiscountCents: z.number().int().min(1).max(100_000_000).optional(), startsAt: z.date().nullable().optional(), endsAt: z.date().nullable().optional(), maxUses: z.number().int().min(1).nullable().optional(), maxUsesPerPlayer: z.number().int().min(1).max(100).default(1), active: z.boolean().default(true), productIds: z.array(z.number().int().positive()).optional() }).superRefine((value, issue) => { if (value.type === "PERCENTAGE" && !value.percentageBasisPoints) issue.addIssue({ code: "custom", message: "Informe o percentual de desconto", path: ["percentageBasisPoints"] }); if (value.type === "FIXED" && !value.fixedDiscountCents) issue.addIssue({ code: "custom", message: "Informe o valor fixo de desconto", path: ["fixedDiscountCents"] }); });

function audit(ctx: { user: { openId: string } }, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  return writeAdminAuditLog(ctx.user.openId, action, entityType, entityId, metadata).catch(() => undefined);
}

export const adminRouter = router({
  overview: adminProcedure.query(getAdminOverview),
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
  createProduct: adminProcedure.input(productInput.extend(productContentInput.shape)).mutation(async ({ ctx, input }) => {
    const id = await createProductRecord(input);
    await audit(ctx, "product.created", "product", String(id), { name: input.name });
    return { id };
  }),
  updateProduct: adminProcedure.input(productInput.extend(productContentInput.shape).extend({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    await updateProductRecord(input.id, input);
    await audit(ctx, "product.updated", "product", String(input.id));
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
    const id = await createCouponRecord(input);
    await audit(ctx, "coupon.created", "coupon", String(id), { code: input.code });
    return { id };
  }),
  updateCoupon: adminProcedure.input(couponInput.safeExtend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await updateCouponRecord(input.id, input);
    await audit(ctx, "coupon.updated", "coupon", String(input.id));
    return { success: true };
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
