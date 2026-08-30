import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { createCategoryRecord, createProductRecord, listAdminCategories } from "../db/adminCatalog";
import { cancelOrderRecord, createCouponRecord, createServerRecord, rotateServerApiKey, deleteCouponRecord, duplicateProductAsDraft, getAdminDeliveryDetail, getAdminMetricsByPeriod, getAdminMonthlySales, getAdminOperationsCenter, getAdminOrderDetail, getAdminOverview, getAdminPerformanceReport, getAdminPlayerProfile, getAdminProductPriceCents, listAdminCoupons, listAdminDeliveries, listAdminLogs, listAdminOrderExport, listAdminOrders, listAdminPlayers, listAdminProducts, listAdminServers, listAdminUsers, listPlayerHistory, retryDeliveryRecord, searchAdminRecords, setAdminRole, setProductStatus, updateCategoryRecord, updateCouponRecord, updateProductRecord, updateServerRecord, writeAdminAuditLog, deleteServerRecord } from "../db/admin";
import { cancelMaintenanceSchedule, enqueueMaintenanceNotificationTest, getMaintenanceControl, getStoreAvailability, listMaintenanceEventExport, scheduleMaintenance, setMaintenanceDiscordChannel, setMaintenanceScheduleTask, setManualMaintenance, setStoreAvailability } from "../db/storeSettings";
import { listActiveLoginLockouts, listRecentLoginAttempts, releaseLoginLockout } from "../db/loginAttempts";
import { getMonthlyClosedTicketMetrics } from "../db/ticketTranscripts";
import { getMonitoringAvailability, getMonitoringHistory, getMonitoringOverview, recordMonitoringBatch, type MonitoringReport } from "../db/monitoring";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { adminProcedure, router } from "../_core/trpc";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(3).max(160);
export const adminMediaUrl = z.string().trim().max(1024).refine(value => (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\/[^\s]+$/i.test(value), { message: "Informe uma URL HTTPS/HTTP ou um caminho relativo iniciado por /." });
export const adminDurationDays = z.number().int().min(1).max(3650);
const productInput = z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(160), slug, kind: z.enum(["VIP", "COINS", "KIT", "COSMETIC"]), priceCents: z.number().int().min(1).max(100_000_000), durationDays: adminDurationDays.nullable().optional(), luckPermsGroup: z.string().trim().max(96).optional(), deliveryCommands: z.array(z.string().trim().min(1).max(255)).max(16).default([]), featured: z.boolean().default(false), serverIds: z.array(z.number().int().positive()).min(1).max(16) }).superRefine((value, issue) => {
  if (!value.deliveryCommands.length && !value.luckPermsGroup) issue.addIssue({ code: "custom", path: ["deliveryCommands"], message: "Informe um comando de entrega ou um grupo LuckPerms." });
});
export const adminProductUpdatePriceCents = z.number().int().min(0).max(100_000_000);
const productUpdateInput = productInput.safeExtend({ priceCents: adminProductUpdatePriceCents });
const productContentInput = z.object({ shortDescription: z.string().trim().max(280).optional(), description: z.string().trim().max(8000).optional(), imageUrl: adminMediaUrl.optional(), imageUrls: z.array(adminMediaUrl).max(12).optional(), position: z.number().int().min(0).max(9999).default(0) });
const couponInput = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).min(3).max(48), description: z.string().trim().max(280).optional(), type: z.enum(["PERCENTAGE", "FIXED"]), percentageBasisPoints: z.number().int().min(1).max(10_000).optional(), fixedDiscountCents: z.number().int().min(1).max(100_000_000).optional(), startsAt: z.date().nullable().optional(), endsAt: z.date().nullable().optional(), maxUses: z.number().int().min(1).nullable().optional(), maxUsesPerPlayer: z.number().int().min(1).max(100).default(1), active: z.boolean().default(true), productIds: z.array(z.number().int().positive()).optional() }).superRefine((value, issue) => { if (value.type === "PERCENTAGE" && !value.percentageBasisPoints) issue.addIssue({ code: "custom", message: "Informe o percentual de desconto", path: ["percentageBasisPoints"] }); if (value.type === "FIXED" && !value.fixedDiscountCents) issue.addIssue({ code: "custom", message: "Informe o valor fixo de desconto", path: ["fixedDiscountCents"] }); if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) issue.addIssue({ code: "custom", message: "A expiração deve ocorrer depois do início do cupom.", path: ["endsAt"] }); });
const maintenanceInput = z.object({ mode: z.enum(["CLOSED", "CATALOG_ONLY"]), offlineMessage: z.string().trim().min(8).max(280), reason: z.string().trim().max(280).optional() });
const maintenanceScheduleInput = maintenanceInput.extend({ startAt: z.date(), endAt: z.date() }).superRefine((value, issue) => { if (value.startAt <= new Date()) issue.addIssue({ code: "custom", path: ["startAt"], message: "Escolha um início futuro para o agendamento." }); if (value.endAt <= value.startAt) issue.addIssue({ code: "custom", path: ["endAt"], message: "O encerramento deve ocorrer depois do início." }); });

function audit(ctx: { user: { openId: string } }, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  return writeAdminAuditLog(ctx.user.openId, action, entityType, entityId, metadata).catch(() => undefined);
}

function maintenanceSession(ctx: { req: { headers: { cookie?: string } } }) {
  return parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
}

export const adminRouter = router({
  loginAttempts: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional()).query(async ({ input }) => listRecentLoginAttempts(input?.limit ?? 20)),
  ingestMonitoring: adminProcedure.input(z.object({ reports: z.array(z.object({ serviceKey: z.string().min(1).max(48), status: z.enum(["ONLINE", "DEGRADED", "OFFLINE"]), latencyMs: z.number().int().min(0).max(120000).nullable().optional(), message: z.string().max(280).nullable().optional() })).min(1).max(8) })).mutation(async ({ input }) => recordMonitoringBatch(input.reports as MonitoringReport[])),
  loginLockouts: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(25) }).optional()).query(async ({ input }) => listActiveLoginLockouts(input?.limit ?? 25)),
  ticketMetrics: adminProcedure.query(() => getMonthlyClosedTicketMetrics()),
  overview: adminProcedure.query(async () => getAdminOverview()),
  monitoring: adminProcedure.query(() => getMonitoringOverview()),
  monitoringHistory: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional()).query(({ input }) => getMonitoringHistory(input?.limit ?? 60)),
  monitoringAvailability: adminProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(30)]) })).query(({ input }) => getMonitoringAvailability(input.days)),

  monthlySales: adminProcedure.query(() => getAdminMonthlySales()),

  metricsByPeriod: adminProcedure.input(z.object({ period: z.enum(["7d", "30d", "90d"]) })).query(({ input }) => getAdminMetricsByPeriod(input.period)),

  operationsCenter: adminProcedure.query(getAdminOperationsCenter),
  performanceReport: adminProcedure.input(z.object({ period: z.enum(["7d", "30d", "90d"]) })).query(({ input }) => getAdminPerformanceReport(input.period)),

  search: adminProcedure.input(z.object({ query: z.string().trim().min(2).max(80) })).query(({ input }) => searchAdminRecords(input.query)),

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
  playerProfile: adminProcedure.input(z.object({ playerId: z.number().int().positive() })).query(async ({ input }) => {
    const profile = await getAdminPlayerProfile(input.playerId);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Jogador não localizado" });
    return profile;
  }),
  deliveries: adminProcedure.query(listAdminDeliveries),
  deliveryDetail: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const result = await getAdminDeliveryDetail(input.id);
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Entrega não localizada" });
    return result;
  }),
  servers: adminProcedure.query(listAdminServers),
  coupons: adminProcedure.query(listAdminCoupons),
  logs: adminProcedure.query(listAdminLogs),
  users: adminProcedure.query(listAdminUsers),
  storeAvailability: adminProcedure.query(getStoreAvailability),
  maintenanceControl: adminProcedure.query(getMaintenanceControl),
  exportMaintenanceHistory: adminProcedure.query(listMaintenanceEventExport),
  releaseLoginLockout: adminProcedure.input(z.object({ emailHash: z.string().regex(/^[a-f0-9]{64}$/) })).mutation(async ({ ctx, input }) => {
    await releaseLoginLockout(input.emailHash);
    await audit(ctx, "login_lockout.released", "login_lockout", input.emailHash.slice(0, 12));
    return { released: true };
  }),
  setStoreAvailability: adminProcedure.input(z.object({ publicOnline: z.boolean(), offlineMessage: z.string().trim().min(8).max(280).optional() })).mutation(async ({ ctx, input }) => {
    const settings = await setStoreAvailability(input);
    await audit(ctx, input.publicOnline ? "store.activated" : "store.deactivated", "store_settings", "1", { publicOnline: input.publicOnline });
    return settings;
  }),
  setMaintenanceDiscordChannel: adminProcedure.input(z.object({ channelId: z.string().trim().regex(/^\d{17,20}$/, "Informe um ID de canal Discord válido.").nullable(), template: z.enum(["STANDARD", "CONCISE", "COMMUNITY"]).default("STANDARD") })).mutation(async ({ ctx, input }) => {
    const settings = await setMaintenanceDiscordChannel(input);
    await audit(ctx, "maintenance.discord_channel_updated", "store_settings", "1", { configured: Boolean(input.channelId), template: input.template });
    return settings;
  }),
  sendMaintenanceNotificationTest: adminProcedure.mutation(async ({ ctx }) => {
    const settings = await enqueueMaintenanceNotificationTest(ctx.user.openId);
    await audit(ctx, "maintenance.discord_test_enqueued", "store_settings", "1", { configuredChannel: Boolean(settings.maintenanceDiscordChannelId), template: settings.maintenanceDiscordTemplate });
    return { queued: true, channelConfigured: Boolean(settings.maintenanceDiscordChannelId) };
  }),
  setManualMaintenance: adminProcedure.input(maintenanceInput.extend({ publicOnline: z.boolean() })).mutation(async ({ ctx, input }) => {
    const result = await setManualMaintenance({ ...input, actorId: ctx.user.openId });
    if (result.previousTaskUid && process.env.SELF_HOSTED !== "true") await updateHeartbeatJob(result.previousTaskUid, { enable: false }, maintenanceSession(ctx)).catch(() => undefined);
    await audit(ctx, input.publicOnline ? "maintenance.ended" : "maintenance.updated", "store_settings", "1", { mode: input.mode, reason: input.reason });
    return result.settings;
  }),
  scheduleMaintenance: adminProcedure.input(maintenanceScheduleInput).mutation(async ({ ctx, input }) => {
    const result = await scheduleMaintenance({ ...input, actorId: ctx.user.openId });
    if (process.env.SELF_HOSTED === "true") {
      await setMaintenanceScheduleTask("self-hosted-maintenance");
      await audit(ctx, "maintenance.scheduled", "store_settings", "1", { startAt: input.startAt.toISOString(), endAt: input.endAt.toISOString(), mode: input.mode, executor: "vps" });
      return getMaintenanceControl();
    }
    const session = maintenanceSession(ctx);
    if (result.existingTaskUid) {
      await updateHeartbeatJob(result.existingTaskUid, { cron: "0 * * * * *", path: "/api/scheduled/store-maintenance", description: "Processa a manutenção agendada da loja", enable: true }, session);
      await setMaintenanceScheduleTask(result.existingTaskUid);
    } else {
      const job = await createHeartbeatJob({ name: "playstorcraft-store-maintenance", cron: "0 * * * * *", path: "/api/scheduled/store-maintenance", description: "Processa a manutenção agendada da loja" }, session);
      await setMaintenanceScheduleTask(job.taskUid);
    }
    await audit(ctx, "maintenance.scheduled", "store_settings", "1", { startAt: input.startAt.toISOString(), endAt: input.endAt.toISOString(), mode: input.mode });
    return getMaintenanceControl();
  }),
  cancelMaintenanceSchedule: adminProcedure.mutation(async ({ ctx }) => {
    const result = await cancelMaintenanceSchedule(ctx.user.openId);
    if (result.taskUid && process.env.SELF_HOSTED !== "true") await updateHeartbeatJob(result.taskUid, { enable: false }, maintenanceSession(ctx)).catch(() => undefined);
    await audit(ctx, "maintenance.schedule_cancelled", "store_settings", "1");
    return result.settings;
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
  duplicateProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const duplicate = await duplicateProductAsDraft(input.id);
    await audit(ctx, "product.duplicated_as_draft", "product", String(duplicate.id), { sourceProductId: input.id, slug: duplicate.slug });
    return duplicate;
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
  rotateServerKey: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
    if (!pepper) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A chave de proteção dos servidores ainda não foi configurada." });
    const result = await rotateServerApiKey(input.id, pepper);
    await audit(ctx, "server.api_key_rotated", "server", String(input.id), { name: result.name, lastFour: result.apiKey.slice(-4) });
    return result;
  }),
  updateServer: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(96), slug: slug.max(48), kind: z.enum(["SURVIVAL", "SKYBLOCK", "BEDWARS", "GLOBAL"]), active: z.boolean() })).mutation(async ({ ctx, input }) => {
    await updateServerRecord(input.id, input);
    await audit(ctx, "server.updated", "server", String(input.id));
    return { success: true };
  }),
  deleteServer: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const result = await deleteServerRecord(input.id);
      await audit(ctx, "server.deleted", "server", String(input.id), { name: result.name });
      return { success: true, ...result };
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível excluir o servidor." });
    }
  }),
  setUserRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.id === input.userId && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover seu próprio acesso administrativo." });
    await setAdminRole(input.userId, input.role);
    await audit(ctx, "user.role_changed", "user", String(input.userId), { role: input.role });
    return { success: true };
  }),
});
