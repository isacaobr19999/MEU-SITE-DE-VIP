import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

export function hasValidIntegrationKey(provided: string, expected = process.env.INTEGRATION_API_KEY ?? "") {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function integrationHealthHandler(req: Request, res: Response) {
  const provided = req.header("x-integration-key") ?? (req.header("authorization")?.startsWith("Bearer ") ? req.header("authorization")!.slice(7) : "");
  if (!hasValidIntegrationKey(provided)) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  return res.status(200).json({ ok: true, service: "minecraft-discord-platform", timestamp: new Date().toISOString() });
}
