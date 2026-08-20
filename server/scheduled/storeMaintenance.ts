import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { processScheduledMaintenance } from "../db/storeSettings";

export async function storeMaintenanceScheduler(req: Request, res: Response) {
  try {
    const expectedSecret = process.env.MAINTENANCE_SECRET;
    if (process.env.SELF_HOSTED === "true" && expectedSecret && req.header("x-maintenance-secret") === expectedSecret) {
      return res.json({ ok: true, ...(await processScheduledMaintenance("self-hosted-maintenance")), executor: "vps" });
    }
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await processScheduledMaintenance(user.taskUid);
    return res.json({ ok: true, ...result, taskUid: user.taskUid });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled-maintenance-failed", context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
