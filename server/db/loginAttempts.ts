import { createHmac } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { loginAttempts, loginLockouts } from "../../drizzle/schema";
import { getDb, requireDb } from "../db";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILURES_BEFORE_LOCK = 5;

export function maskLoginEmail(value: string) {
  const [local, domain] = value.trim().toLowerCase().split("@");
  if (!local || !domain) return "e-mail não informado";
  return `${local.slice(0, 1)}${"•".repeat(Math.min(Math.max(local.length - 1, 2), 6))}@${domain}`;
}

function loginFingerprint(value: string) {
  const normalized = value.trim().toLowerCase();
  const key = process.env.JWT_SECRET || "playstorcraft-login-lock-development-key";
  return createHmac("sha256", key).update(normalized).digest("hex");
}

export async function recordLoginAttempt(input: { email: string; userId?: number; success: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(loginAttempts).values({ id: crypto.randomUUID(), userId: input.userId ?? null, emailHint: maskLoginEmail(input.email), outcome: input.success ? "SUCCESS" : "FAILED", method: "PASSWORD", createdAt: new Date() });
}

export async function getLoginLockout(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [state] = await db.select().from(loginLockouts).where(eq(loginLockouts.emailHash, loginFingerprint(email))).limit(1);
  if (!state?.lockedUntil || state.lockedUntil.getTime() <= Date.now()) return null;
  return state.lockedUntil;
}

export async function registerFailedLogin(email: string) {
  const db = await requireDb();
  const fingerprint = loginFingerprint(email);
  const now = new Date();
  const [current] = await db.select().from(loginLockouts).where(eq(loginLockouts.emailHash, fingerprint)).limit(1);
  const expiredWindow = !current || current.windowStartedAt.getTime() <= now.getTime() - FAILURE_WINDOW_MS;
  const failedAttempts = expiredWindow ? 1 : current.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_FAILURES_BEFORE_LOCK ? new Date(now.getTime() + LOCK_DURATION_MS) : null;
  const values = { emailHash: fingerprint, failedAttempts, windowStartedAt: expiredWindow ? now : current.windowStartedAt, lockedUntil };
  if (current) await db.update(loginLockouts).set(values).where(eq(loginLockouts.emailHash, fingerprint));
  else await db.insert(loginLockouts).values(values);
  return { failedAttempts, lockedUntil };
}

export async function clearLoginFailureState(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(loginLockouts).where(eq(loginLockouts.emailHash, loginFingerprint(email)));
}

export async function listRecentLoginAttempts(limit = 25) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: loginAttempts.id, emailHint: loginAttempts.emailHint, outcome: loginAttempts.outcome, method: loginAttempts.method, createdAt: loginAttempts.createdAt }).from(loginAttempts).orderBy(desc(loginAttempts.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}
