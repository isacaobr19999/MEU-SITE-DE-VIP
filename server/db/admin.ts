import { and, asc, count, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { adminUsers, categories,   couponProducts,
  couponUsage,
 coupons, deliveries, logs, orderItems, orders, players, productServers, products, servers, users } from "../../drizzle/schema";
import { hashSecret } from "../services/secretHash";
import { requireDb } from "../db";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getAdminOverview() {
  const db = await requireDb();
  const now = new Date();
  const completedStatuses = ["PAID", "PROCESSING", "COMPLETED"] as const;
  const [todaySales] = await db.select({ value: sql<number>`coalesce(sum(${orders.totalCents}), 0)` }).from(orders).where(and(inArray(orders.status, completedStatuses), gte(orders.paidAt, startOfUtcDay(now))));
  const [monthSales] = await db.select({ value: sql<number>`coalesce(sum(${orders.totalCents}), 0)` }).from(orders).where(and(inArray(orders.status, completedStatuses), gte(orders.paidAt, startOfUtcMonth(now))));
  const [pendingOrders] = await db.select({ value: count() }).from(orders).where(inArray(orders.status, ["PENDING", "WAITING_PAYMENT", "PAID", "PROCESSING"]));
  const [pendingDeliveries] = await db.select({ value: count() }).from(deliveries).where(inArray(deliveries.status, ["PENDING", "RETRYING", "CLAIMED", "PROCESSING"]));
  const [failedDeliveries] = await db.select({ value: count() }).from(deliveries).where(eq(deliveries.status, "FAILED"));
  const [playerCount] = await db.select({ value: count() }).from(players);
  return {
    salesTodayCents: Number(todaySales?.value ?? 0),
    salesMonthCents: Number(monthSales?.value ?? 0),
    pendingOrders: pendingOrders?.value ?? 0,
    pendingDeliveries: pendingDeliveries?.value ?? 0,
    failedDeliveries: failedDeliveries?.value ?? 0,
    playerCount: playerCount?.value ?? 0,
  };
}

export async function listAdminProducts() {
  const db = await requireDb();
  const [rows, assignments] = await Promise.all([
    db.select({ id: products.id, categoryId: products.categoryId, name: products.name, slug: products.slug, shortDescription: products.shortDescription, description: products.description, imageUrl: products.imageUrl, priceCents: products.priceCents, kind: products.kind, durationDays: products.durationDays, luckPermsGroup: products.luckPermsGroup, deliveryCommands: products.deliveryCommands, active: products.active, featured: products.featured, categoryName: categories.name, position: products.position }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).orderBy(asc(products.position), asc(products.name)),
    db.select({ productId: productServers.productId, serverId: productServers.serverId }).from(productServers),
  ]);
  return rows.map(row => ({ ...row, serverIds: assignments.filter(assignment => assignment.productId === row.id).map(assignment => assignment.serverId) }));
}

export async function getAdminProductPriceCents(id: number) {
  const db = await requireDb();
  const [product] = await db.select({ priceCents: products.priceCents }).from(products).where(eq(products.id, id)).limit(1);
  return product?.priceCents;
}

export async function updateCategoryRecord(id: number, input: { name: string; slug: string; description?: string; imageUrl?: string; position: number; active: boolean }) {
  const db = await requireDb();
  await db.update(categories).set({ name: input.name, slug: input.slug, description: input.description ?? null, imageUrl: input.imageUrl ?? null, position: input.position, active: input.active }).where(eq(categories.id, id));
}

export async function setProductStatus(id: number, active: boolean) {
  const db = await requireDb();
  await db.update(products).set({ active }).where(eq(products.id, id));
}

export async function listAdminOrders() {
  const db = await requireDb();
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt, paidAt: orders.paidAt, playerName: players.username, playerUuid: players.uuid }).from(orders).innerJoin(players, eq(orders.playerId, players.id)).orderBy(desc(orders.createdAt)).limit(100);
}

export async function listAdminOrderExport() {
  const db = await requireDb();
  return db.select({ orderNumber: orders.orderNumber, status: orders.status, totalCents: orders.totalCents, discountCents: orders.discountCents, createdAt: orders.createdAt, paidAt: orders.paidAt, playerName: players.username, playerUuid: players.uuid, couponCode: coupons.code }).from(orders).innerJoin(players, eq(orders.playerId, players.id)).leftJoin(coupons, eq(orders.couponId, coupons.id)).orderBy(desc(orders.createdAt)).limit(5000);
}

export async function getAdminMonthlySales(monthCount = 6) {
  const db = await requireDb();
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1));
  const completedStatuses = ["PAID", "PROCESSING", "COMPLETED"] as const;
  const monthExpression = sql<string>`date_format(${orders.paidAt}, '%Y-%m')`;
  const rows = await db.select({ month: monthExpression, salesCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`, paidOrders: count() }).from(orders).where(and(inArray(orders.status, completedStatuses), gte(orders.paidAt, firstMonth))).groupBy(monthExpression).orderBy(monthExpression);
  const monthly = new Map(rows.map(row => [row.month, { salesCents: Number(row.salesCents ?? 0), paidOrders: Number(row.paidOrders ?? 0) }]));
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const values = monthly.get(key) ?? { salesCents: 0, paidOrders: 0 };
    return { key, label: formatter.format(date).replace(".", ""), ...values };
  });
}

export async function listAdminPlayers() {
  const db = await requireDb();
  return db.select({ id: players.id, username: players.username, uuid: players.uuid, email: players.email, lastSeenAt: players.lastSeenAt, createdAt: players.createdAt }).from(players).orderBy(desc(players.createdAt)).limit(100);
}

export async function listAdminDeliveries() {
  const db = await requireDb();
  return db.select({ id: deliveries.id, status: deliveries.status, attemptCount: deliveries.attemptCount, maxAttempts: deliveries.maxAttempts, nextAttemptAt: deliveries.nextAttemptAt, lastError: deliveries.lastError, orderNumber: orders.orderNumber, playerName: players.username, serverName: servers.name }).from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).innerJoin(players, eq(deliveries.playerId, players.id)).innerJoin(servers, eq(deliveries.serverId, servers.id)).orderBy(desc(deliveries.createdAt)).limit(100);
}

export async function listAdminServers() {
  const db = await requireDb();
  return db.select({ id: servers.id, name: servers.name, slug: servers.slug, kind: servers.kind, active: servers.active, apiKeyLastFour: servers.apiKeyLastFour, createdAt: servers.createdAt }).from(servers).orderBy(asc(servers.name));
}

export async function createServerRecord(input: { name: string; slug: string; kind: "SURVIVAL" | "SKYBLOCK" | "BEDWARS" | "GLOBAL" }, pepper: string) {
  const db = await requireDb();
  const apiKey = `psc_${randomBytes(24).toString("base64url")}`;
  const apiKeyHash = await hashSecret(apiKey, pepper);
  const result = await db.insert(servers).values({ ...input, apiKeyHash, apiKeyLastFour: apiKey.slice(-4) });
  return { id: result[0].insertId, apiKey };
}

export async function listAdminCoupons() {
  const db = await requireDb();
  const [rows, assignments, usages] = await Promise.all([
    db.select().from(coupons).where(isNull(coupons.archivedAt)).orderBy(desc(coupons.createdAt)),
    db.select({ couponId: couponProducts.couponId, productId: couponProducts.productId }).from(couponProducts),
    db.select({ couponId: couponUsage.couponId, usedCount: count() }).from(couponUsage).groupBy(couponUsage.couponId),
  ]);
  const usageByCoupon = new Map(usages.map(usage => [usage.couponId, Number(usage.usedCount)]));
  return rows.map(row => ({ ...row, productIds: assignments.filter(assignment => assignment.couponId === row.id).map(assignment => assignment.productId), usedCount: usageByCoupon.get(row.id) ?? 0 }));
}

export async function createCouponRecord(input: { code: string; description?: string; type: "PERCENTAGE" | "FIXED"; percentageBasisPoints?: number; fixedDiscountCents?: number; startsAt?: Date | null; endsAt?: Date | null; maxUses?: number | null; maxUsesPerPlayer: number; active: boolean; productIds?: number[] }) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const result = await tx.insert(coupons).values({
      code: input.code,
      description: input.description ?? null,
      type: input.type,
      percentageBasisPoints: input.type === "PERCENTAGE" ? input.percentageBasisPoints ?? null : null,
      fixedDiscountCents: input.type === "FIXED" ? input.fixedDiscountCents ?? null : null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      maxUses: input.maxUses ?? null,
      maxUsesPerPlayer: input.maxUsesPerPlayer,
      active: input.active,
    });
    const couponId = Number(result[0].insertId);
    if (input.productIds?.length) {
      await tx.insert(couponProducts).values(input.productIds.map(productId => ({ couponId, productId })));
    }
    return couponId;
  });
}

export async function listAdminLogs() {
  const db = await requireDb();
  return db.select().from(logs).orderBy(desc(logs.createdAt)).limit(150);
}

export async function listAdminUsers() {
  const db = await requireDb();
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, permissions: adminUsers.permissions, active: adminUsers.active }).from(users).leftJoin(adminUsers, eq(users.id, adminUsers.userId)).orderBy(asc(users.name)).limit(100);
}

export async function setAdminRole(userId: number, role: "admin" | "user") {
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(users).set({ role }).where(eq(users.id, userId));
    if (role === "admin") {
      await tx.insert(adminUsers).values({ userId, permissions: ["catalog:write", "orders:read", "deliveries:read", "coupons:write", "servers:write", "logs:read"], active: true }).onDuplicateKeyUpdate({ set: { active: true } });
    } else {
      await tx.update(adminUsers).set({ active: false }).where(eq(adminUsers.userId, userId));
    }
  });
}

export async function writeAdminAuditLog(actorId: string, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  const db = await requireDb();
  await db.insert(logs).values({ actorType: "admin", actorId, action, entityType, entityId: entityId ?? null, metadata: metadata ?? null });
}

export async function listOrderItemsForAdmin(orderId: string) {
  const db = await requireDb();
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAdminOrderDetail(id: string) {
  const db = await requireDb();
  const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, subtotalCents: orders.subtotalCents, totalCents: orders.totalCents, discountCents: orders.discountCents, couponCode: coupons.code, createdAt: orders.createdAt, paidAt: orders.paidAt, playerName: players.username, playerUuid: players.uuid, playerId: players.id }).from(orders).innerJoin(players, eq(orders.playerId, players.id)).leftJoin(coupons, eq(orders.couponId, coupons.id)).where(eq(orders.id, id)).limit(1);
  if (!order) return undefined;
  const items = await listOrderItemsForAdmin(id);
  return { ...order, items };
}

export async function cancelOrderRecord(id: string) {
  const db = await requireDb();
  const result = await db.update(orders).set({ status: "CANCELLED", cancelledAt: new Date() }).where(and(eq(orders.id, id), inArray(orders.status, ["PENDING", "WAITING_PAYMENT"])));
  if (result[0].affectedRows !== 1) throw new Error("Somente pedidos aguardando pagamento podem ser cancelados manualmente.");
}

export async function listPlayerHistory(playerId: number) {
  const db = await requireDb();
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt }).from(orders).where(eq(orders.playerId, playerId)).orderBy(desc(orders.createdAt)).limit(50);
}

export async function retryDeliveryRecord(id: string) {
  const db = await requireDb();
  const result = await db.update(deliveries).set({ status: "PENDING", claimedByServerId: null, claimTokenHash: null, claimExpiresAt: null, nextAttemptAt: new Date(), lastError: null }).where(and(eq(deliveries.id, id), inArray(deliveries.status, ["FAILED", "RETRYING", "PENDING"])));
  if (result[0].affectedRows !== 1) throw new Error("A entrega não pode ser reprocessada no estado atual.");
}

export async function updateServerRecord(id: number, input: { name: string; slug: string; kind: "SURVIVAL" | "SKYBLOCK" | "BEDWARS" | "GLOBAL"; active: boolean }) {
  const db = await requireDb();
  await db.update(servers).set(input).where(eq(servers.id, id));
}

export async function deleteCouponRecord(id: number) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const [usage] = await tx.select({ value: count() }).from(couponUsage).where(eq(couponUsage.couponId, id));
    if (usage.value > 0) {
      const result = await tx.update(coupons).set({ active: false, archivedAt: new Date() }).where(eq(coupons.id, id));
      if (result[0].affectedRows !== 1) throw new Error("Cupom não localizado.");
      return { deleted: false, deactivated: true };
    }
    await tx.delete(couponProducts).where(eq(couponProducts.couponId, id));
    const result = await tx.delete(coupons).where(eq(coupons.id, id));
    if (result[0].affectedRows !== 1) throw new Error("Cupom não localizado.");
    return { deleted: true, deactivated: false };
  });
}

export async function updateCouponRecord(id: number, input: { code: string; description?: string; type: "PERCENTAGE" | "FIXED"; percentageBasisPoints?: number; fixedDiscountCents?: number; startsAt?: Date | null; endsAt?: Date | null; maxUses?: number | null; maxUsesPerPlayer: number; active: boolean; productIds?: number[] }) {
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(coupons).set({ code: input.code, description: input.description ?? null, type: input.type, percentageBasisPoints: input.type === "PERCENTAGE" ? input.percentageBasisPoints ?? null : null, fixedDiscountCents: input.type === "FIXED" ? input.fixedDiscountCents ?? null : null, startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null, maxUses: input.maxUses ?? null, maxUsesPerPlayer: input.maxUsesPerPlayer, active: input.active }).where(eq(coupons.id, id));
    if (input.productIds) {
      await tx.delete(couponProducts).where(eq(couponProducts.couponId, id));
      if (input.productIds.length) await tx.insert(couponProducts).values(input.productIds.map(productId => ({ couponId: id, productId })));
    }
  });
}

export async function updateProductRecord(id: number, input: { categoryId: number; name: string; slug: string; shortDescription?: string; description?: string; imageUrl?: string; kind: "VIP" | "COINS" | "KIT" | "COSMETIC"; priceCents: number; durationDays?: number | null; luckPermsGroup?: string; deliveryCommands: string[]; featured: boolean; active: boolean; position: number; serverIds: number[] }) {
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(products).set({ categoryId: input.categoryId, name: input.name, slug: input.slug, shortDescription: input.shortDescription ?? null, description: input.description ?? null, imageUrl: input.imageUrl ?? null, kind: input.kind, priceCents: input.priceCents, durationDays: input.durationDays ?? null, luckPermsGroup: input.luckPermsGroup ?? null, deliveryCommands: input.deliveryCommands, featured: input.featured, active: input.active, position: input.position }).where(eq(products.id, id));
    await tx.delete(productServers).where(eq(productServers.productId, id));
    await tx.insert(productServers).values(input.serverIds.map(serverId => ({ productId: id, serverId })));
  });
}
