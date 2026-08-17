import type { Request, Response } from "express";
import { z } from "zod";
import { syncMinecraftPlayer } from "./db/players";
import { authenticateMinecraftServer, claimDeliveriesForServer, completeClaimedDelivery, deferClaimedDelivery, failClaimedDelivery } from "./db/deliveries";
import { upsertCommunityStatus } from "./db/community";

const claimInput = z.object({ limit: z.number().int().min(1).max(20).default(10) });
const acknowledgment = z.object({ deliveryId: z.string().uuid(), claimToken: z.string().min(20).max(256), error: z.string().trim().min(1).max(2000).optional() });
export const playerSyncInput = z.object({ username: z.string().trim().min(3).max(16).regex(/^[A-Za-z0-9_]+$/), uuid: z.string().uuid() });
export const minecraftStatusInput = z.object({
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]),
  playersOnline: z.number().int().min(0).max(10_000).optional(),
  playersMax: z.number().int().min(1).max(10_000).optional(),
  motd: z.string().trim().max(280).optional(),
  version: z.string().trim().max(96).optional(),
});

async function serverFor(req: Request) {
  const apiKey = req.header("x-playstor-server-key");
  if (!apiKey) return undefined;
  return authenticateMinecraftServer(apiKey);
}

export async function syncMinecraftPlayerRoute(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const payload = playerSyncInput.parse(req.body);
    await syncMinecraftPlayer(payload.username, payload.uuid);
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}

export async function updateMinecraftStatusRoute(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const payload = minecraftStatusInput.parse(req.body);
    await upsertCommunityStatus({ discord: {}, minecraft: payload, sourceUpdatedAt: new Date() });
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}

export async function claimMinecraftDeliveries(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const { limit } = claimInput.parse(req.body ?? {});
    res.json({ deliveries: await claimDeliveriesForServer(server.id, limit) });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}

export async function completeMinecraftDelivery(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const payload = acknowledgment.parse(req.body);
    await completeClaimedDelivery(server.id, payload.deliveryId, payload.claimToken);
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}

export async function failMinecraftDelivery(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const payload = acknowledgment.required({ error: true }).parse(req.body);
    await failClaimedDelivery(server.id, payload.deliveryId, payload.claimToken, payload.error);
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}

export async function deferMinecraftDelivery(req: Request, res: Response) {
  try {
    const server = await serverFor(req);
    if (!server) return res.status(401).json({ error: "Servidor não autorizado" });
    const payload = acknowledgment.parse(req.body);
    await deferClaimedDelivery(server.id, payload.deliveryId, payload.claimToken);
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Solicitação inválida" }); }
}
