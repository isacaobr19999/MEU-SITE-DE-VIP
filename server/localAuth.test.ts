import { scryptSync } from "crypto";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLocalUser: vi.fn(),
  createSessionToken: vi.fn(),
  getSessionCookieOptions: vi.fn(),
  getUserByEmail: vi.fn(),
  hasAnyUser: vi.fn(),
  recordLoginAttempt: vi.fn(),
}));

vi.mock("./db", () => ({
  createLocalUser: mocks.createLocalUser,
  getUserByEmail: mocks.getUserByEmail,
  hasAnyUser: mocks.hasAnyUser,
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: mocks.createSessionToken } }));
vi.mock("./_core/cookies", () => ({ getSessionCookieOptions: mocks.getSessionCookieOptions }));
vi.mock("./db/loginAttempts", () => ({ recordLoginAttempt: mocks.recordLoginAttempt }));

import { registerLocalAuthRoutes } from "./localAuth";

function handlerFor(pathname: "/api/auth/register" | "/api/auth/login") {
  let handler: ((req: any, res: any) => Promise<unknown>) | undefined;
  registerLocalAuthRoutes({ post: vi.fn((path, callback) => { if (path === pathname) handler = callback; }) } as any);
  if (!handler) throw new Error(`Rota ${pathname} não registrada.`);
  return handler;
}

function response() {
  const res = { cookie: vi.fn(), json: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("cadastro local", () => {
  it("rejeita dados de cadastro incompletos antes de acessar o banco", async () => {
    const res = response();
    await handlerFor("/api/auth/register")({ body: { name: "A", email: "invalido", password: "curta" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Informe nome, e-mail e senha com ao menos 10 caracteres." });
    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });

  it("impede cadastro duplicado sem alterar a conta existente", async () => {
    mocks.getUserByEmail.mockResolvedValue({ id: 1, email: "existente@example.com" });
    const res = response();
    await handlerFor("/api/auth/register")({ body: { name: "Pessoa Existente", email: "EXISTENTE@example.com", password: "senha-segura" } }, res);
    expect(mocks.getUserByEmail).toHaveBeenCalledWith("existente@example.com");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Este e-mail já está cadastrado." });
    expect(mocks.createLocalUser).not.toHaveBeenCalled();
  });

  it("cria uma conta comum somente quando os dados são válidos", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.hasAnyUser.mockResolvedValue(true);
    mocks.createLocalUser.mockResolvedValue({ id: 2, openId: "local:2", name: "Novo Jogador", email: "novo@example.com", role: "user" });
    mocks.createSessionToken.mockResolvedValue("session-token");
    mocks.getSessionCookieOptions.mockReturnValue({ httpOnly: true });
    const res = response();
    await handlerFor("/api/auth/register")({ protocol: "https", body: { name: " Novo Jogador ", email: "NOVO@example.com", password: "senha-segura" } }, res);
    expect(mocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo Jogador", email: "novo@example.com", role: "user" }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(expect.any(String), "session-token", expect.objectContaining({ httpOnly: true }));
    expect(res.json).toHaveBeenCalledWith({ id: 2, name: "Novo Jogador", email: "novo@example.com", role: "user" });
  });
});

describe("login local", () => {
  it("registra tentativa recusada sem informar se o e-mail existe", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.recordLoginAttempt.mockResolvedValue(undefined);
    const res = response();
    await handlerFor("/api/auth/login")({ body: { email: "inexistente@example.com", password: "senha-segura" } }, res);
    expect(mocks.recordLoginAttempt).toHaveBeenCalledWith({ email: "inexistente@example.com", userId: undefined, success: false });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "E-mail ou senha inválidos." });
  });

  it("registra tentativa aprovada antes de iniciar a sessão", async () => {
    const salt = "0123456789abcdef0123456789abcdef";
    const passwordHash = `${salt}:${scryptSync("senha-segura", salt, 64).toString("hex")}`;
    mocks.getUserByEmail.mockResolvedValue({ id: 7, openId: "local_7", email: "admin@example.com", passwordHash, name: "Admin", role: "admin" });
    mocks.recordLoginAttempt.mockResolvedValue(undefined);
    mocks.createSessionToken.mockResolvedValue("session-token");
    mocks.getSessionCookieOptions.mockReturnValue({ httpOnly: true });
    const res = response();
    await handlerFor("/api/auth/login")({ protocol: "https", body: { email: "ADMIN@example.com", password: "senha-segura" } }, res);
    expect(mocks.recordLoginAttempt).toHaveBeenCalledWith({ email: "admin@example.com", userId: 7, success: true });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 7, role: "admin" }));
  });
});
