import { count, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { maintenanceEvents, orders, storeSettings } from "../../drizzle/schema";
import { requireDb } from "../db";
import { enqueueDiscordNotification } from "./discordNotifications";

const DEFAULT_OFFLINE_MESSAGE = "A loja está temporariamente em manutenção. Volte em breve.";
const protectedOrderStatuses = ["PAID", "PROCESSING", "COMPLETED"] as const;

export type MaintenanceMode = "CLOSED" | "CATALOG_ONLY";
export type MaintenanceScheduleStatus = "NONE" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type StoreAvailability = {
  publicOnline: boolean;
  offlineMessage: string;
  maintenanceMode: MaintenanceMode;
  maintenanceReason: string | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  scheduleStatus: MaintenanceScheduleStatus;
  scheduleStartedAt: Date | null;
  scheduleEndedAt: Date | null;
  scheduleCronTaskUid: string | null;
  maintenanceDiscordChannelId: string | null;
  updatedAt: Date | null;
};

function defaultAvailability(): StoreAvailability {
  return { publicOnline: true, offlineMessage: DEFAULT_OFFLINE_MESSAGE, maintenanceMode: "CLOSED", maintenanceReason: null, scheduledStartAt: null, scheduledEndAt: null, scheduleStatus: "NONE", scheduleStartedAt: null, scheduleEndedAt: null, scheduleCronTaskUid: null, maintenanceDiscordChannelId: null, updatedAt: null };
}

function messageOrDefault(message?: string | null) {
  return message?.trim() || DEFAULT_OFFLINE_MESSAGE;
}

async function recordMaintenanceEvent(input: { eventType: "SCHEDULED" | "STARTED" | "ENDED" | "CANCELLED" | "UPDATED"; mode: MaintenanceMode; message: string; reason?: string | null; scheduledStartAt?: Date | null; scheduledEndAt?: Date | null; actorId?: string | null; actorType: "admin" | "scheduler" }) {
  const db = await requireDb();
  await db.insert(maintenanceEvents).values({ id: randomUUID(), eventType: input.eventType, mode: input.mode, message: input.message, reason: input.reason ?? null, scheduledStartAt: input.scheduledStartAt ?? null, scheduledEndAt: input.scheduledEndAt ?? null, actorId: input.actorId ?? null, actorType: input.actorType });
}

export async function getStoreAvailability(): Promise<StoreAvailability> {
  const db = await requireDb();
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  return row ?? defaultAvailability();
}

export async function getPublicStoreAvailability() {
  const settings = await getStoreAvailability();
  const estimatedReturnAt = ["SCHEDULED", "ACTIVE"].includes(settings.scheduleStatus) ? settings.scheduledEndAt : null;
  return { publicOnline: settings.publicOnline, offlineMessage: settings.offlineMessage, maintenanceMode: settings.maintenanceMode, estimatedReturnAt };
}

export async function getMaintenanceControl() {
  const db = await requireDb();
  const [settings, protectedOrders, history] = await Promise.all([
    getStoreAvailability(),
    db.select({ value: count() }).from(orders).where(inArray(orders.status, protectedOrderStatuses)),
    db.select().from(maintenanceEvents).orderBy(desc(maintenanceEvents.createdAt)).limit(8),
  ]);
  return { settings, protectedOrders: Number(protectedOrders[0]?.value ?? 0), history };
}

export async function listMaintenanceEventExport() {
  const db = await requireDb();
  return db.select().from(maintenanceEvents).orderBy(desc(maintenanceEvents.createdAt)).limit(2000);
}

export async function setMaintenanceDiscordChannel(channelId: string | null) {
  const db = await requireDb();
  await db.insert(storeSettings).values({ id: 1, maintenanceDiscordChannelId: channelId }).onDuplicateKeyUpdate({ set: { maintenanceDiscordChannelId: channelId } });
  return getStoreAvailability();
}

export async function setStoreAvailability(input: { publicOnline: boolean; offlineMessage?: string }) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  const values = {
    id: 1,
    publicOnline: input.publicOnline,
    offlineMessage: input.offlineMessage?.trim() || current.offlineMessage || DEFAULT_OFFLINE_MESSAGE,
  };
  await db.insert(storeSettings).values(values).onDuplicateKeyUpdate({ set: values });
  return getStoreAvailability();
}

export async function setManualMaintenance(input: { publicOnline: boolean; mode: MaintenanceMode; offlineMessage: string; reason?: string; actorId: string }) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  await setStoreAvailability({ publicOnline: input.publicOnline, offlineMessage: input.offlineMessage });
  const values = {
    maintenanceMode: input.mode,
    maintenanceReason: input.reason?.trim() || null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    scheduleStatus: "CANCELLED" as const,
    scheduleStartedAt: null,
    scheduleEndedAt: input.publicOnline ? new Date() : null,
  };
  await db.update(storeSettings).set(values).where(eq(storeSettings.id, 1));
  const settings = await getStoreAvailability();
  await recordMaintenanceEvent({ eventType: input.publicOnline ? "ENDED" : "UPDATED", mode: input.mode, message: settings.offlineMessage, reason: values.maintenanceReason, actorId: input.actorId, actorType: "admin" });
  await enqueueDiscordNotification({ eventType: input.publicOnline ? "STORE_MAINTENANCE_ENDED" : "STORE_MAINTENANCE_STARTED", dedupeKey: `maintenance-manual:${input.publicOnline ? "ended" : "started"}:${settings.updatedAt?.toISOString() ?? Date.now()}`, payload: { mode: input.mode, message: settings.offlineMessage, reason: values.maintenanceReason, channelId: settings.maintenanceDiscordChannelId, manual: true } });
  return { settings, previousTaskUid: current.scheduleCronTaskUid };
}

export async function scheduleMaintenance(input: { startAt: Date; endAt: Date; mode: MaintenanceMode; offlineMessage: string; reason?: string; actorId: string }) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  await setStoreAvailability({ publicOnline: true, offlineMessage: input.offlineMessage });
  const values = {
    maintenanceMode: input.mode,
    maintenanceReason: input.reason?.trim() || null,
    scheduledStartAt: input.startAt,
    scheduledEndAt: input.endAt,
    scheduleStatus: "SCHEDULED" as const,
    scheduleStartedAt: null,
    scheduleEndedAt: null,
  };
  await db.update(storeSettings).set(values).where(eq(storeSettings.id, 1));
  const settings = await getStoreAvailability();
  await recordMaintenanceEvent({ eventType: "SCHEDULED", mode: input.mode, message: settings.offlineMessage, reason: values.maintenanceReason, scheduledStartAt: input.startAt, scheduledEndAt: input.endAt, actorId: input.actorId, actorType: "admin" });
  return { settings, existingTaskUid: current.scheduleCronTaskUid };
}

export async function setMaintenanceScheduleTask(taskUid: string) {
  const db = await requireDb();
  await db.update(storeSettings).set({ scheduleCronTaskUid: taskUid }).where(eq(storeSettings.id, 1));
  return getStoreAvailability();
}

export async function cancelMaintenanceSchedule(actorId: string) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  await db.update(storeSettings).set({ scheduledStartAt: null, scheduledEndAt: null, scheduleStatus: "CANCELLED", scheduleStartedAt: null, scheduleEndedAt: null }).where(eq(storeSettings.id, 1));
  await recordMaintenanceEvent({ eventType: "CANCELLED", mode: current.maintenanceMode, message: current.offlineMessage, reason: current.maintenanceReason, actorId, actorType: "admin" });
  return { settings: await getStoreAvailability(), taskUid: current.scheduleCronTaskUid };
}

export async function processScheduledMaintenance(taskUid: string) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  if (current.scheduleCronTaskUid !== taskUid || ["NONE", "CANCELLED", "COMPLETED"].includes(current.scheduleStatus)) return { action: "skipped" as const };
  const now = new Date();
  if (!current.scheduledStartAt || !current.scheduledEndAt || now < current.scheduledStartAt) return { action: "waiting" as const };
  const scheduleKey = current.scheduledStartAt.toISOString();
  if (now >= current.scheduledEndAt) {
    if (current.scheduleStatus === "ACTIVE") {
      await db.update(storeSettings).set({ publicOnline: true, scheduleStatus: "COMPLETED", scheduleEndedAt: now }).where(eq(storeSettings.id, 1));
      await recordMaintenanceEvent({ eventType: "ENDED", mode: current.maintenanceMode, message: current.offlineMessage, reason: current.maintenanceReason, scheduledStartAt: current.scheduledStartAt, scheduledEndAt: current.scheduledEndAt, actorType: "scheduler" });
      await enqueueDiscordNotification({ eventType: "STORE_MAINTENANCE_ENDED", dedupeKey: `maintenance-ended:${scheduleKey}`, payload: { mode: current.maintenanceMode, reason: current.maintenanceReason, channelId: current.maintenanceDiscordChannelId, scheduledEndAt: current.scheduledEndAt.toISOString() } });
      return { action: "ended" as const };
    }
    await db.update(storeSettings).set({ scheduleStatus: "COMPLETED", scheduleEndedAt: now }).where(eq(storeSettings.id, 1));
    return { action: "expired" as const };
  }
  if (current.scheduleStatus === "ACTIVE" && current.publicOnline === false) return { action: "active" as const };
  await db.update(storeSettings).set({ publicOnline: false, scheduleStatus: "ACTIVE", scheduleStartedAt: now }).where(eq(storeSettings.id, 1));
  await recordMaintenanceEvent({ eventType: "STARTED", mode: current.maintenanceMode, message: current.offlineMessage, reason: current.maintenanceReason, scheduledStartAt: current.scheduledStartAt, scheduledEndAt: current.scheduledEndAt, actorType: "scheduler" });
  await enqueueDiscordNotification({ eventType: "STORE_MAINTENANCE_STARTED", dedupeKey: `maintenance-started:${scheduleKey}`, payload: { mode: current.maintenanceMode, message: current.offlineMessage, reason: current.maintenanceReason, channelId: current.maintenanceDiscordChannelId, scheduledEndAt: current.scheduledEndAt.toISOString() } });
  return { action: "started" as const };
}

export async function assertStoreOnline() {
  const settings = await getStoreAvailability();
  if (!settings.publicOnline) throw new Error(settings.maintenanceMode === "CATALOG_ONLY" ? "A loja está em modo catálogo. Compras e pagamentos serão liberados após a manutenção." : settings.offlineMessage || DEFAULT_OFFLINE_MESSAGE);
}
