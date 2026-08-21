import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { clearLoginFailureState, getLoginLockout, maskLoginEmail, recordLoginAttempt, registerFailedLogin } from "./db/loginAttempts";
import { enqueueDiscordNotification } from "./db/discordNotifications";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

async function startSession(req: Request, res: Response, user: NonNullable<Awaited<ReturnType<typeof db.getUserByEmail>>>) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name ?? user.email ?? "Usuário", expiresInMs: ONE_YEAR_MS });
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || name.trim().length < 2 || password.length < 10) return res.status(400).json({ error: "Informe nome, e-mail e senha com ao menos 10 caracteres." });
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: "E-mail inválido." });
    if (await db.getUserByEmail(normalizedEmail)) return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    const user = await db.createLocalUser({ name: name.trim(), email: normalizedEmail, passwordHash: hashPassword(password), role: (await db.hasAnyUser()) ? "user" : "admin" });
    if (!user) return res.status(500).json({ error: "Não foi possível criar o usuário." });
    res.status(201).json(await startSession(req, res, user));
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ error: "Credenciais inválidas." });
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(normalizedEmail);
    const lockedUntil = await getLoginLockout(normalizedEmail);
    if (lockedUntil) {
      void recordLoginAttempt({ email: normalizedEmail, userId: user?.id, success: false }).catch(() => undefined);
      return res.status(429).json({ error: "Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente." });
    }
    const success = Boolean(user?.passwordHash && verifyPassword(password, user.passwordHash));
    void recordLoginAttempt({ email: normalizedEmail, userId: user?.id, success }).catch(() => undefined);
    if (!success || !user) {
      const failure = await registerFailedLogin(normalizedEmail).catch(() => ({ failedAttempts: 0, lockedUntil: null }));
      if (user?.role === "admin") {
        void enqueueDiscordNotification({
          eventType: "LOGIN_SECURITY_ALERT",
          dedupeKey: `admin-login-failed:${user.id}:${Date.now()}`,
          payload: { emailHint: maskLoginEmail(normalizedEmail), failedAttempts: failure.failedAttempts, lockedUntil: failure.lockedUntil?.toISOString() ?? null },
        }).catch(() => undefined);
      }
      if (failure.lockedUntil) return res.status(429).json({ error: "Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente." });
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }
    void clearLoginFailureState(normalizedEmail).catch(() => undefined);
    res.json(await startSession(req, res, user));
  });
}
