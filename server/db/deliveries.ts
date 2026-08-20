import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { deliveries, orderItems, orders, players, servers, vipGrants } from "../../drizzle/schema";
import { requireDb } from "../db";
import { hashSecret, verifySecret } from "../services/secretHash";
import { enqueueDiscordNotification } from "./discordNotifications";

type ClaimedDelivery = { deliveryId: string; claimToken: string; player: string; uuid: string; server: string; product: string; duration: string; commands: string[] };

export function expandDeliveryCommand(template: string, values: { player: string; uuid: string; server: string; product: string; duration: string }) {
  return template.replaceAll("{player}", values.player).replaceAll("{uuid}", values.uuid).replaceAll("{server}", values.server).replaceAll("{product}", values.product).replaceAll("{duration}", values.duration);
}

export function deliveryIdempotencyKey(orderId: string, orderItemId: number) {
  return `delivery:${orderId}:${orderItemId}`;
}

export async function authenticateMinecraftServer(rawApiKey: string) {
  const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
  if (!pepper) throw new Error("A proteção das chaves dos servidores ainda não foi configurada.");
  const db = await requireDb();
  const candidates = await db.select().from(servers).where(eq(servers.active, true));
  for (const server of candidates) if (await verifySecret(rawApiKey, server.apiKeyHash, pepper)) return server;
  return undefined;
}

export async function claimDeliveriesForServer(serverId: number, limit: number) {
  const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
  if (!pepper) throw new Error("A proteção das chaves dos servidores ainda não foi configurada.");
  const db = await requireDb();
  const now = new Date();
  return db.transaction(async tx => {
    const candidates = await tx.select().from(deliveries).where(and(eq(deliveries.serverId, serverId), inArray(deliveries.status, ["PENDING", "RETRYING"]), lte(deliveries.nextAttemptAt, now))).limit(limit * 2);
    const claimed: ClaimedDelivery[] = [];
    for (const delivery of candidates) {
      if (claimed.length >= limit) break;
      const claimToken = randomBytes(24).toString("base64url");
      const claimExpiresAt = new Date(Date.now() + 5 * 60_000);
      const result = await tx.update(deliveries).set({ status: "CLAIMED", claimedByServerId: serverId, claimTokenHash: await hashSecret(claimToken, pepper), claimExpiresAt }).where(and(eq(deliveries.id, delivery.id), inArray(deliveries.status, ["PENDING", "RETRYING"])));
      if (result[0].affectedRows !== 1) continue;
      const [detail] = await tx.select({ player: players.username, uuid: players.uuid, server: servers.name, product: orderItems.productName, durationDays: orderItems.durationDays, commands: deliveries.commandTemplates }).from(deliveries).innerJoin(orderItems, eq(deliveries.orderItemId, orderItems.id)).innerJoin(players, eq(deliveries.playerId, players.id)).innerJoin(servers, eq(deliveries.serverId, servers.id)).where(eq(deliveries.id, delivery.id)).limit(1);
      if (!detail) continue;
      const values = { player: detail.player, uuid: detail.uuid, server: detail.server, product: detail.product, duration: detail.durationDays ? String(detail.durationDays) : "permanent" };
      claimed.push({ deliveryId: delivery.id, claimToken, ...values, commands: detail.commands.map(command => expandDeliveryCommand(command, values)) });
    }
    return claimed;
  });
}

async function assertClaim(serverId: number, deliveryId: string, claimToken: string) {
  const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
  if (!pepper) throw new Error("A proteção das chaves dos servidores ainda não foi configurada.");
  const db = await requireDb();
  const [delivery] = await db.select().from(deliveries).where(and(eq(deliveries.id, deliveryId), eq(deliveries.serverId, serverId))).limit(1);
  if (!delivery || delivery.status !== "CLAIMED" || !delivery.claimTokenHash || !delivery.claimExpiresAt || delivery.claimExpiresAt < new Date()) throw new Error("A reivindicação da entrega não é válida.");
  if (!(await verifySecret(claimToken, delivery.claimTokenHash, pepper))) throw new Error("O token de entrega não é válido.");
  return delivery;
}

export async function completeClaimedDelivery(serverId: number, deliveryId: string, claimToken: string) {
  const delivery = await assertClaim(serverId, deliveryId, claimToken);
  const db = await requireDb();
  const completed = await db.transaction(async tx => {
    const result = await tx.update(deliveries).set({ status: "COMPLETED", completedAt: new Date(), claimTokenHash: null, claimExpiresAt: null, lastError: null }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, "CLAIMED")));
    if (result[0].affectedRows !== 1) return undefined;
    const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, delivery.orderItemId)).limit(1);
    if (item?.luckPermsGroup) {
      await tx.insert(vipGrants).values({ id: randomUUID(), playerId: delivery.playerId, productId: item.productId, serverId: delivery.serverId, groupName: item.luckPermsGroup, grantedByDeliveryId: delivery.id, startsAt: new Date(), expiresAt: item.durationDays ? new Date(Date.now() + item.durationDays * 86_400_000) : null });
    }
    const outstanding = await tx.select({ id: deliveries.id }).from(deliveries).where(and(eq(deliveries.orderId, delivery.orderId), inArray(deliveries.status, ["PENDING", "CLAIMED", "PROCESSING", "RETRYING", "FAILED"])));
    if (!outstanding.length) await tx.update(orders).set({ status: "COMPLETED", completedAt: new Date() }).where(eq(orders.id, delivery.orderId));
    const [detail] = await tx.select({ orderNumber: orders.orderNumber, playerName: players.username, productName: orderItems.productName })
      .from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).innerJoin(players, eq(deliveries.playerId, players.id)).innerJoin(orderItems, eq(deliveries.orderItemId, orderItems.id))
      .where(eq(deliveries.id, delivery.id)).limit(1);
    return detail;
  });
  if (completed) await enqueueDiscordNotification({ eventType: "DELIVERY_COMPLETED", orderId: delivery.orderId, deliveryId, dedupeKey: `delivery-completed:${deliveryId}`, payload: completed });
}

export async function failClaimedDelivery(serverId: number, deliveryId: string, claimToken: string, error: string) {
  const delivery = await assertClaim(serverId, deliveryId, claimToken);
  const db = await requireDb();
  const nextAttempt = delivery.attemptCount + 1;
  const retry = nextAttempt < delivery.maxAttempts;
  const delayMs = Math.min(60 * 60_000, 15_000 * 2 ** Math.min(nextAttempt, 8));
  const result = await db.update(deliveries).set({ status: retry ? "RETRYING" : "FAILED", attemptCount: nextAttempt, nextAttemptAt: new Date(Date.now() + delayMs), claimTokenHash: null, claimExpiresAt: null, lastError: error.slice(0, 2000) }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, "CLAIMED")));
  if (!retry && result[0].affectedRows === 1) {
    const [detail] = await db.select({ orderNumber: orders.orderNumber, playerName: players.username, productName: orderItems.productName })
      .from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).innerJoin(players, eq(deliveries.playerId, players.id)).innerJoin(orderItems, eq(deliveries.orderItemId, orderItems.id))
      .where(eq(deliveries.id, deliveryId)).limit(1);
    if (detail) await enqueueDiscordNotification({ eventType: "DELIVERY_FAILED", orderId: delivery.orderId, deliveryId, dedupeKey: `delivery-failed:${deliveryId}`, payload: { ...detail, error: error.slice(0, 280) } });
  }
}

export async function deferClaimedDelivery(serverId: number, deliveryId: string, claimToken: string) {
  const delivery = await assertClaim(serverId, deliveryId, claimToken);
  const db = await requireDb();
  await db.update(deliveries).set({ status: "PENDING", claimTokenHash: null, claimExpiresAt: null, nextAttemptAt: new Date(Date.now() + 60_000), lastError: "Jogador offline; entrega adiada sem consumir tentativa." }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, "CLAIMED")));
}

export async function recoverExpiredClaimsAndVipGrants() {
  const db = await requireDb();
  const now = new Date();
  const expiredClaims = await db.update(deliveries).set({ status: "RETRYING", claimTokenHash: null, claimExpiresAt: null, nextAttemptAt: now, lastError: "A reivindicação expirou antes da confirmação." }).where(and(eq(deliveries.status, "CLAIMED"), lte(deliveries.claimExpiresAt, now)));
  const grants = await db.select().from(vipGrants).where(and(lte(vipGrants.expiresAt, now), sql`${vipGrants.revokedAt} IS NULL`));
  let expiryQueued = 0;
  for (const grant of grants) {
    const [source] = await db.select().from(deliveries).where(eq(deliveries.id, grant.grantedByDeliveryId)).limit(1);
    if (!source) continue;
    await db.transaction(async tx => {
      await tx.insert(deliveries).values({ id: randomUUID(), orderId: source.orderId, orderItemId: source.orderItemId, playerId: grant.playerId, serverId: grant.serverId, status: "PENDING", commandTemplates: [`@luckperms:remove:${grant.groupName}`], idempotencyKey: `vip-expiry:${grant.id}` }).onDuplicateKeyUpdate({ set: { nextAttemptAt: now } });
      await tx.update(vipGrants).set({ revokedAt: now }).where(and(eq(vipGrants.id, grant.id), sql`${vipGrants.revokedAt} IS NULL`));
    });
    expiryQueued += 1;
  }
  return { expiredClaims: expiredClaims[0].affectedRows ?? 0, expiryQueued };
}
