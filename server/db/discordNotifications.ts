import { and, asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { discordNotifications } from "../../drizzle/schema";
import { requireDb } from "../db";

export type DiscordNotificationEvent = "PAYMENT_APPROVED" | "DELIVERY_COMPLETED" | "DELIVERY_FAILED" | "STORE_MAINTENANCE_STARTED" | "STORE_MAINTENANCE_ENDED" | "STORE_MAINTENANCE_TEST";

export async function enqueueDiscordNotification(input: { eventType: DiscordNotificationEvent; orderId?: string; deliveryId?: string; dedupeKey: string; payload: Record<string, unknown> }) {
  const db = await requireDb();
  await db.insert(discordNotifications).values({
    id: randomUUID(),
    eventType: input.eventType,
    orderId: input.orderId ?? null,
    deliveryId: input.deliveryId ?? null,
    dedupeKey: input.dedupeKey,
    payload: input.payload,
  }).onDuplicateKeyUpdate({ set: { dedupeKey: input.dedupeKey } });
}

export async function listPendingDiscordNotifications(limit = 10) {
  const db = await requireDb();
  return db.select({ id: discordNotifications.id, eventType: discordNotifications.eventType, payload: discordNotifications.payload, createdAt: discordNotifications.createdAt })
    .from(discordNotifications)
    .where(eq(discordNotifications.status, "PENDING"))
    .orderBy(asc(discordNotifications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 25));
}

export async function markDiscordNotificationsSent(ids: string[]) {
  if (!ids.length) return 0;
  const db = await requireDb();
  const result = await db.update(discordNotifications).set({ status: "SENT", sentAt: new Date() })
    .where(and(inArray(discordNotifications.id, ids), eq(discordNotifications.status, "PENDING")));
  return Number(result[0].affectedRows ?? 0);
}
