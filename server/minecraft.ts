import type { Request, Response } from "express";
import { z } from "zod";
import { authenticateMinecraftServer, claimDeliveriesForServer, completeClaimedDelivery, deferClaimedDelivery, failClaimedDelivery } from "./db/deliveries";

const claimInput = z.object({ limit: z.number().int().min(1).max(20).default(10) });
const acknowledgment = z.object({ deliveryId: z.string().uuid(), claimToken: z.string().min(20).max(256), error: z.string().trim().min(1).max(2000).optional() });

async function serverFor(req: Request) {
  const apiKey = req.header("x-playstor-server-key");
  if (!apiKey) return undefined;
  return authenticateMinecraftServer(apiKey);
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
