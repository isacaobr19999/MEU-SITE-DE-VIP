import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { discordNotifications, monitoringChecks, monitoringIncidents, monitoringServices } from "../../drizzle/schema";
import { requireDb } from "../db";

export const MONITORING_SERVICE_DEFAULTS = [
  { serviceKey: "store", label: "Loja pública", kind: "STORE" as const, endpoint: "/" },
  { serviceKey: "api", label: "API da loja", kind: "API" as const, endpoint: "/api/trpc/community.status" },
  { serviceKey: "discord", label: "Bot Discord", kind: "DISCORD" as const, endpoint: "/api/trpc/community.status" },
  { serviceKey: "minecraft", label: "Servidor Paper", kind: "MINECRAFT" as const, endpoint: "/api/trpc/community.status" },
] as const;

export type MonitoringReport = {
  serviceKey: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs?: number | null;
  message?: string | null;
};

export async function ensureMonitoringServices() {
  const db = await requireDb();
  for (const service of MONITORING_SERVICE_DEFAULTS) {
    await db.insert(monitoringServices).values(service).onDuplicateKeyUpdate({ set: { label: service.label, kind: service.kind, endpoint: service.endpoint, active: true } });
  }
  return db.select().from(monitoringServices).where(eq(monitoringServices.active, true)).orderBy(monitoringServices.id);
}

export async function getMonitoringOverview() {
  const db = await requireDb();
  const services = await ensureMonitoringServices();
  const incidents = await db.select({
    id: monitoringIncidents.id,
    serviceId: monitoringIncidents.serviceId,
    serviceKey: monitoringServices.serviceKey,
    label: monitoringServices.label,
    status: monitoringIncidents.status,
    openedAt: monitoringIncidents.openedAt,
    resolvedAt: monitoringIncidents.resolvedAt,
    lastMessage: monitoringIncidents.lastMessage,
  }).from(monitoringIncidents).innerJoin(monitoringServices, eq(monitoringIncidents.serviceId, monitoringServices.id)).where(eq(monitoringIncidents.status, "OPEN")).orderBy(desc(monitoringIncidents.openedAt)).limit(20);
  return { refreshedAt: new Date().toISOString(), services, incidents };
}

export async function getMonitoringHistory(limit = 60) {
  const db = await requireDb();
  return db.select({
    id: monitoringChecks.id,
    serviceKey: monitoringServices.serviceKey,
    label: monitoringServices.label,
    status: monitoringChecks.status,
    latencyMs: monitoringChecks.latencyMs,
    message: monitoringChecks.message,
    checkedAt: monitoringChecks.checkedAt,
  }).from(monitoringChecks).innerJoin(monitoringServices, eq(monitoringChecks.serviceId, monitoringServices.id)).orderBy(desc(monitoringChecks.checkedAt)).limit(limit);
}

export async function recordMonitoringBatch(reports: MonitoringReport[]) {
  const db = await requireDb();
  const services = await ensureMonitoringServices();
  const now = new Date();
  const notifications: Array<{ eventType: "MONITORING_ALERT"; dedupeKey: string; payload: Record<string, unknown> }> = [];
  for (const report of reports) {
    const service = services.find(item => item.serviceKey === report.serviceKey);
    if (!service) continue;
    const isHealthy = report.status === "ONLINE";
    const failures = isHealthy ? 0 : service.consecutiveFailures + 1;
    await db.insert(monitoringChecks).values({ serviceId: service.id, status: report.status, latencyMs: report.latencyMs ?? null, message: report.message ?? null, checkedAt: now });
    await db.update(monitoringServices).set({ currentStatus: report.status, lastCheckedAt: now, lastSuccessAt: isHealthy ? now : service.lastSuccessAt, lastFailureAt: isHealthy ? service.lastFailureAt : now, lastLatencyMs: report.latencyMs ?? null, lastMessage: report.message ?? null, consecutiveFailures: failures }).where(eq(monitoringServices.id, service.id));
    const open = (await db.select().from(monitoringIncidents).where(and(eq(monitoringIncidents.serviceId, service.id), eq(monitoringIncidents.status, "OPEN"))).limit(1))[0];
    if (!isHealthy && !open) {
      const notificationKey = `monitoring:${service.serviceKey}:${now.getTime()}`;
      await db.insert(monitoringIncidents).values({ serviceId: service.id, status: "OPEN", lastMessage: report.message ?? `Status ${report.status}`, notificationKey });
      notifications.push({ eventType: "MONITORING_ALERT", dedupeKey: notificationKey, payload: { serviceKey: service.serviceKey, label: service.label, status: report.status, message: report.message, latencyMs: report.latencyMs, openedAt: now.toISOString() } });
    } else if (isHealthy && open) {
      await db.update(monitoringIncidents).set({ status: "RESOLVED", resolvedAt: now, lastMessage: report.message ?? "Serviço recuperado" }).where(eq(monitoringIncidents.id, open.id));
      const notificationKey = `monitoring:resolved:${service.serviceKey}:${open.id}`;
      notifications.push({ eventType: "MONITORING_ALERT", dedupeKey: notificationKey, payload: { serviceKey: service.serviceKey, label: service.label, status: "RESOLVED", message: "Serviço recuperado", resolvedAt: now.toISOString() } });
    }
  }
  for (const notification of notifications) {
    await db.insert(discordNotifications).values({ id: crypto.randomUUID(), eventType: notification.eventType, status: "PENDING", dedupeKey: notification.dedupeKey, payload: notification.payload }).onDuplicateKeyUpdate({ set: { payload: notification.payload, status: "PENDING" } });
  }
  await db.delete(monitoringChecks).where(lt(monitoringChecks.checkedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  return getMonitoringOverview();
}

export async function getMonitoringStatusSnapshot() {
  const overview = await getMonitoringOverview();
  return overview.services.map(service => ({ serviceKey: service.serviceKey, status: service.currentStatus, lastCheckedAt: service.lastCheckedAt, consecutiveFailures: service.consecutiveFailures }));
}
