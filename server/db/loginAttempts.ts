import { desc } from "drizzle-orm";
import { loginAttempts } from "../../drizzle/schema";
import { getDb } from "../db";

function maskEmail(value: string) {
  const [local, domain] = value.trim().toLowerCase().split("@");
  if (!local || !domain) return "e-mail não informado";
  return `${local.slice(0, 1)}${"•".repeat(Math.min(Math.max(local.length - 1, 2), 6))}@${domain}`;
}

export async function recordLoginAttempt(input: { email: string; userId?: number; success: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(loginAttempts).values({ id: crypto.randomUUID(), userId: input.userId ?? null, emailHint: maskEmail(input.email), outcome: input.success ? "SUCCESS" : "FAILED", method: "PASSWORD", createdAt: new Date() });
}

export async function listRecentLoginAttempts(limit = 25) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: loginAttempts.id, emailHint: loginAttempts.emailHint, outcome: loginAttempts.outcome, method: loginAttempts.method, createdAt: loginAttempts.createdAt }).from(loginAttempts).orderBy(desc(loginAttempts.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}
