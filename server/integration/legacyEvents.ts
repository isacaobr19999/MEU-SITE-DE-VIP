import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { integrationEvents } from "../../drizzle/schema";
import { getDb } from "../db";
import { syncMinecraftPlayer } from "../db/players";
import { upsertCommunityStatus } from "../db/community";
import { hasValidIntegrationKey } from "./legacyHealth";

const eventSchema = z.object({
  id: z.string().min(8).max(64),
  idempotencyKey: z.string().min(8).max(128),
  type: z.enum(["server.heartbeat", "player.joined", "player.left", "player.stats.snapshot", "chat.minecraft"]),
  origin: z.literal("minecraft"),
  version: z.literal(1),
  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
});

const playerPayload = z.object({
  uuid: z.string().uuid(),
  username: z.string().trim().min(3).max(16).regex(/^[A-Za-z0-9_]+$/),
});

const heartbeatPayload = z.object({
  serverKey: z.string().trim().min(1).max(64),
  online: z.boolean(),
  playersOnline: z.number().int().min(0).max(10_000),
  playerLimit: z.number().int().min(1).max(10_000),
  tps: z.string().regex(/^\d{1,2}(\.\d{1,2})?$/).optional(),
  minecraftVersion: z.string().trim().max(96).optional(),
});

function providedKey(req: Request) {
  const header = req.header("x-integration-key");
  if (header) return header;
  const authorization = req.header("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function safeEventPayload(type: string, payload: Record<string, unknown>) {
  if (type === "chat.minecraft") {
    return { uuid: payload.uuid, username: payload.username, bridgeOrigin: payload.bridgeOrigin };
  }
  return payload;
}

export async function legacyEventsHandler(req: Request, res: Response) {
  if (!hasValidIntegrationKey(providedKey(req))) return res.status(401).json({ accepted: false, error: "UNAUTHORIZED" });
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ accepted: false, error: "INVALID_EVENT" });

  const db = await getDb();
  if (!db) return res.status(503).json({ accepted: false, error: "DATABASE_UNAVAILABLE" });
  const event = parsed.data;
  const payload = safeEventPayload(event.type, event.payload);

  try {
    await db.insert(integrationEvents).values({ ...event, payload });
  } catch (error) {
    if (String(error).toLowerCase().includes("duplicate")) return res.status(200).json({ accepted: true, deduplicated: true, idempotencyKey: event.idempotencyKey });
    console.error("[LegacyIntegration] Could not persist event", error);
    return res.status(503).json({ accepted: false, error: "EVENT_PERSISTENCE_FAILED" });
  }

  try {
    if (event.type === "server.heartbeat") {
      const heartbeat = heartbeatPayload.parse(event.payload);
      await upsertCommunityStatus({
        discord: {},
        minecraft: {
          status: heartbeat.online ? "ONLINE" : "OFFLINE",
          playersOnline: heartbeat.playersOnline,
          playersMax: heartbeat.playerLimit,
          version: heartbeat.minecraftVersion,
          tpsMilli: heartbeat.tps ? Math.round(Number(heartbeat.tps) * 1000) : undefined,
        },
        sourceUpdatedAt: new Date(event.occurredAt),
      });
    } else if (["player.joined", "player.left", "player.stats.snapshot"].includes(event.type)) {
      await syncMinecraftPlayer(playerPayload.parse(event.payload).username, playerPayload.parse(event.payload).uuid);
    }

    await db.update(integrationEvents).set({ status: "PROCESSED", processedAt: new Date() }).where(eq(integrationEvents.id, event.id));
    return res.status(202).json({ accepted: true, deduplicated: false, idempotencyKey: event.idempotencyKey });
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 255) : "EVENT_PROCESSING_FAILED";
    await db.update(integrationEvents).set({ status: "FAILED", failureReason: reason, processedAt: new Date() }).where(eq(integrationEvents.id, event.id));
    return res.status(400).json({ accepted: false, error: reason });
  }
}

export function registerLegacyIntegrationRoutes(app: Express) {
  app.post("/api/integration/events", legacyEventsHandler);
}
