import type { Express, Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { integrationEvents } from "../../drizzle/schema";
import { requireDb } from "../db";
import { hasValidIntegrationKey } from "./legacyHealth";

const LINK_CONFIRMATION_EVENT = "minecraft.link.confirmed";
const LEGACY_COMMAND_TYPE = "chat.discord";

function integrationKey(req: Request) {
  const header = req.header("x-integration-key");
  if (header) return header;
  const authorization = req.header("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function unauthorized(res: Response) {
  return res.status(401).json({ commands: [], error: "UNAUTHORIZED" });
}

export function buildLinkConfirmationMessage(username: string) {
  return `Conta Minecraft vinculada com sucesso: ${username}.`;
}

export async function enqueueLinkConfirmation(input: { code: string; username: string }) {
  const db = await requireDb();
  await db.insert(integrationEvents).values({
    id: randomUUID(),
    idempotencyKey: `minecraft-link-confirmed:${input.code}`,
    type: LINK_CONFIRMATION_EVENT,
    origin: "discord",
    payload: { username: input.username, message: buildLinkConfirmationMessage(input.username) },
    status: "RECEIVED",
  });
}

export async function listPendingLegacyCommands(req: Request, res: Response) {
  if (!hasValidIntegrationKey(integrationKey(req))) return unauthorized(res);
  try {
    const db = await requireDb();
    const events = await db.select({ id: integrationEvents.id, payload: integrationEvents.payload })
      .from(integrationEvents)
      .where(and(eq(integrationEvents.type, LINK_CONFIRMATION_EVENT), eq(integrationEvents.status, "RECEIVED")))
      .orderBy(asc(integrationEvents.createdAt))
      .limit(25);
    return res.status(200).json({
      commands: events.map(event => ({ id: event.id, type: LEGACY_COMMAND_TYPE, payload: event.payload })),
    });
  } catch {
    return res.status(503).json({ commands: [], error: "COMMAND_QUEUE_UNAVAILABLE" });
  }
}

export async function reportLegacyCommandResult(req: Request, res: Response) {
  if (!hasValidIntegrationKey(integrationKey(req))) return res.status(401).json({ accepted: false, error: "UNAUTHORIZED" });
  const eventId = typeof req.body?.eventId === "string" ? req.body.eventId.trim() : "";
  const success = req.body?.success === true;
  if (!eventId || eventId.length > 64) return res.status(400).json({ accepted: false, error: "INVALID_COMMAND_RESULT" });
  try {
    const db = await requireDb();
    const result = await db.update(integrationEvents)
      .set({ status: success ? "PROCESSED" : "FAILED", failureReason: success ? null : String(req.body?.message ?? "COMMAND_FAILED").slice(0, 255), processedAt: new Date() })
      .where(and(eq(integrationEvents.id, eventId), eq(integrationEvents.type, LINK_CONFIRMATION_EVENT), eq(integrationEvents.status, "RECEIVED")));
    return res.status(200).json({ accepted: Number(result[0]?.affectedRows ?? 0) > 0 });
  } catch {
    return res.status(503).json({ accepted: false, error: "COMMAND_RESULT_UNAVAILABLE" });
  }
}

export function registerLegacyCommandRoutes(app: Express) {
  app.get("/api/integration/admin/commands/pending", listPendingLegacyCommands);
  app.post("/api/integration/admin/commands/result", reportLegacyCommandResult);
}
