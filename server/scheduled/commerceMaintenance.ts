import type { Request, Response } from "express";
import { recoverExpiredClaimsAndVipGrants } from "../db/deliveries";

export async function commerceMaintenance(req: Request, res: Response) {
  try {
    const expectedSecret = process.env.MAINTENANCE_SECRET;
    const receivedSecret = req.header("x-maintenance-secret");
    if (!expectedSecret || !receivedSecret || receivedSecret !== expectedSecret) return res.status(403).json({ error: "maintenance-only" });
    res.json({ ok: true, ...(await recoverExpiredClaimsAndVipGrants()) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Falha na manutenção", timestamp: new Date().toISOString() });
  }
}
