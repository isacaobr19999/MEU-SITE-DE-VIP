import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { upsertCommunityStatus } from "./db/community";

const httpsUrl = z.string().url().max(1024).refine(value => value.startsWith("https://"), "A URL precisa usar HTTPS");
const optionalNonNegativeInt = z.number().int().min(0).max(10_000_000).optional();

export const communityStatusInput = z.object({
  discord: z.object({
    guildId: z.string().trim().regex(/^\d{16,22}$/).optional(),
    name: z.string().trim().min(2).max(100).optional(),
    iconUrl: httpsUrl.optional(),
    inviteUrl: httpsUrl.optional(),
    memberCount: optionalNonNegativeInt,
    onlineCount: optionalNonNegativeInt,
    online: z.boolean().default(true),
  }).default({ online: true }),
  minecraft: z.object({
    status: z.enum(["UNKNOWN", "ONLINE", "OFFLINE", "MAINTENANCE"]).default("UNKNOWN"),
    playersOnline: optionalNonNegativeInt,
    playersMax: optionalNonNegativeInt,
    motd: z.string().trim().max(280).optional(),
    version: z.string().trim().max(96).optional(),
  }).default({ status: "UNKNOWN" }),
  sourceUpdatedAt: z.coerce.date().optional(),
});

export function isDiscordBridgeAuthorized(providedSecret: string | undefined, configuredSecret = process.env.DISCORD_BOT_BRIDGE_SECRET) {
  if (!providedSecret || !configuredSecret) return false;
  const provided = Buffer.from(providedSecret);
  const configured = Buffer.from(configuredSecret);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
}

export async function updateCommunityStatusRoute(req: Request, res: Response) {
  try {
    if (!isDiscordBridgeAuthorized(req.header("x-playstor-discord-secret"))) return res.status(401).json({ error: "Ponte Discord não autorizada" });
    const payload = communityStatusInput.parse(req.body);
    const status = await upsertCommunityStatus(payload);
    return res.json({ ok: true, status });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Atualização inválida" });
  }
}
