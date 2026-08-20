import type { Request, Response } from "express";
import { z } from "zod";
import { isDiscordBridgeAuthorized } from "./community";
import { listPendingDiscordNotifications, markDiscordNotificationsSent } from "./db/discordNotifications";

const notificationIdsInput = z.object({ ids: z.array(z.string().uuid()).min(1).max(25) });

function authorized(req: Request) {
  return isDiscordBridgeAuthorized(req.header("x-playstor-discord-secret"));
}

export async function listDiscordNotificationsRoute(req: Request, res: Response) {
  try {
    if (!authorized(req)) return res.status(401).json({ error: "Ponte Discord não autorizada" });
    const rawLimit = Number(req.query.limit ?? 10);
    const notifications = await listPendingDiscordNotifications(Number.isFinite(rawLimit) ? rawLimit : 10);
    return res.json({ notifications });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível consultar notificações." });
  }
}

export async function acknowledgeDiscordNotificationsRoute(req: Request, res: Response) {
  try {
    if (!authorized(req)) return res.status(401).json({ error: "Ponte Discord não autorizada" });
    const { ids } = notificationIdsInput.parse(req.body);
    return res.json({ acknowledged: await markDiscordNotificationsSent(ids) });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Confirmação inválida." });
  }
}
