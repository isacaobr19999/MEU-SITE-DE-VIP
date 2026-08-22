import type { Express, Request, Response } from "express";
import { and, eq, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { discordAccounts, minecraftLinkCodes, playerDiscordLinks, players } from "../../drizzle/schema";
import { requireDb } from "../db";
import { syncMinecraftPlayer } from "../db/players";
import { hasValidIntegrationKey } from "./legacyHealth";

function keyFromRequest(req: Request) {
  const header = req.header("x-integration-key");
  if (header) return header;
  const authorization = req.header("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

const linkInput = z.object({ uuid: z.string().uuid(), username: z.string().trim().min(3).max(16).regex(/^[A-Za-z0-9_]+$/), target: z.enum(["discord", "site"]) });
const redeemInput = z.object({ code: z.string().regex(/^\d{6}$/), discordUserId: z.string().min(2).max(32), username: z.string().trim().min(3).max(16).regex(/^[A-Za-z0-9_]+$/), globalName: z.string().max(128).nullable().optional() });

function unauthorized(res: Response) {
  return res.status(401).json({ linked: false, created: false, error: "UNAUTHORIZED" });
}

export async function createLinkCodeHandler(req: Request, res: Response) {
  if (!hasValidIntegrationKey(keyFromRequest(req))) return unauthorized(res);
  const input = linkInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ created: false, error: "INVALID_LINK_REQUEST" });
  try {
    const playerId = await syncMinecraftPlayer(input.data.username, input.data.uuid);
    const db = await requireDb();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      try {
        await db.insert(minecraftLinkCodes).values({ code, playerId, target: input.data.target === "discord" ? "DISCORD" : "SITE", expiresAt });
        return res.status(201).json({ created: true, code, expiresAt: expiresAt.toISOString() });
      } catch (error) {
        if (!String(error).toLowerCase().includes("duplicate")) throw error;
      }
    }
    return res.status(503).json({ created: false, error: "CODE_GENERATION_FAILED" });
  } catch (error) {
    return res.status(400).json({ created: false, error: error instanceof Error ? error.message : "LINK_FAILED" });
  }
}

export async function redeemDiscordLinkCodeHandler(req: Request, res: Response) {
  if (!hasValidIntegrationKey(keyFromRequest(req))) return unauthorized(res);
  const input = redeemInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ linked: false, error: "INVALID_LINK_REQUEST" });
  const db = await requireDb();
  try {
    const result = await db.transaction(async tx => {
      const [code] = await tx.select({ link: minecraftLinkCodes, player: players }).from(minecraftLinkCodes).innerJoin(players, eq(minecraftLinkCodes.playerId, players.id)).where(eq(minecraftLinkCodes.code, input.data.code)).limit(1);
      if (!code || code.link.target !== "DISCORD" || code.link.usedAt || code.link.expiresAt.getTime() <= Date.now()) throw new Error("LINK_CODE_INVALID_OR_EXPIRED");
      const [account] = await tx.select().from(discordAccounts).where(eq(discordAccounts.discordUserId, input.data.discordUserId)).limit(1);
      const discordAccountId = account?.id ?? Number((await tx.insert(discordAccounts).values({ discordUserId: input.data.discordUserId, globalName: input.data.globalName ?? null }))[0].insertId);
      if (account) await tx.update(discordAccounts).set({ globalName: input.data.globalName ?? account.globalName }).where(eq(discordAccounts.id, account.id));
      const [playerLink] = await tx.select().from(playerDiscordLinks).where(and(eq(playerDiscordLinks.playerId, code.player.id), isNull(playerDiscordLinks.unlinkedAt))).limit(1);
      if (playerLink) throw new Error("PLAYER_ALREADY_LINKED");
      const [discordLink] = await tx.select().from(playerDiscordLinks).where(and(eq(playerDiscordLinks.discordAccountId, discordAccountId), isNull(playerDiscordLinks.unlinkedAt))).limit(1);
      if (discordLink) throw new Error("DISCORD_ALREADY_LINKED");
      await tx.insert(playerDiscordLinks).values({ playerId: code.player.id, discordAccountId });
      await tx.update(minecraftLinkCodes).set({ usedAt: new Date(), discordAccountId }).where(eq(minecraftLinkCodes.code, input.data.code));
      return { minecraftPlayerId: code.player.id, username: code.player.username, uuid: code.player.uuid, discordUserId: input.data.discordUserId };
    });
    return res.status(200).json({ linked: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LINK_FAILED";
    return res.status(message === "PLAYER_ALREADY_LINKED" || message === "DISCORD_ALREADY_LINKED" ? 409 : 400).json({ linked: false, error: message });
  }
}

export async function revokeLinkCodeHandler(req: Request, res: Response) {
  if (!hasValidIntegrationKey(keyFromRequest(req))) return unauthorized(res);
  const input = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ revoked: false, error: "INVALID_CODE" });
  const db = await requireDb();
  const result = await db.update(minecraftLinkCodes).set({ usedAt: new Date() }).where(and(eq(minecraftLinkCodes.code, input.data.code), isNull(minecraftLinkCodes.usedAt)));
  return res.status(200).json({ revoked: Number(result[0].affectedRows ?? 0) > 0 });
}

export function registerLegacyLinkRoutes(app: Express) {
  app.post("/api/integration/link-codes", createLinkCodeHandler);
  app.post("/api/integration/link-codes/redeem-discord", redeemDiscordLinkCodeHandler);
  app.post("/api/integration/link-codes/revoke", revokeLinkCodeHandler);
}
