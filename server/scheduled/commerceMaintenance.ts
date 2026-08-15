import type { Request, Response } from "express";
import { recoverExpiredClaimsAndVipGrants } from "../db/deliveries";
import { sdk } from "../_core/sdk";

export async function commerceMaintenance(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    res.json({ ok: true, ...(await recoverExpiredClaimsAndVipGrants()) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Falha na manutenção", timestamp: new Date().toISOString() });
  }
}
