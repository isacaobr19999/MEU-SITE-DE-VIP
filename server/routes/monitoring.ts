import type { Request, Response } from "express";
import { z } from "zod";
import { recordMonitoringBatch } from "../db/monitoring";

const reportSchema = z.object({
  reports: z.array(z.object({
    serviceKey: z.string().min(1).max(48),
    status: z.enum(["ONLINE", "DEGRADED", "OFFLINE"]),
    latencyMs: z.number().int().min(0).max(120000).nullable().optional(),
    message: z.string().max(280).nullable().optional(),
  })).min(1).max(8),
});

export async function ingestMonitoringRoute(req: Request, res: Response) {
  try {
    const expected = process.env.MAINTENANCE_SECRET;
    const received = String(req.headers["x-maintenance-secret"] ?? "");
    if (!expected || received !== expected) return res.status(403).json({ error: "forbidden" });
    const input = reportSchema.parse(req.body);
    const result = await recordMonitoringBatch(input.reports);
    return res.json({ ok: true, refreshedAt: result.refreshedAt, services: result.services.map(service => ({ serviceKey: service.serviceKey, status: service.currentStatus })) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "monitoring_failed", timestamp: new Date().toISOString() });
  }
}
