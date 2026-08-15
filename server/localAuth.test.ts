import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLocalUser: vi.fn(),
  createSessionToken: vi.fn(),
  getSessionCookieOptions: vi.fn(),
  getUserByEmail: vi.fn(),
  hasAnyUser: vi.fn(),
}));

vi.mock("./db", () => ({
  createLocalUser: mocks.createLocalUser,
  getUserByEmail: mocks.getUserByEmail,
  hasAnyUser: mocks.hasAnyUser,
}));

vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: mocks.createSessionToken } }));
vi.mock("./_core/cookies", () => ({ getSessionCookieOptions: mocks.getSessionCookieOptions }));

import { registerLocalAuthRoutes } from "./localAuth";

function registerHandler() {
  let handler: ((req: any, res: any) => Promise<unknown>) | undefined;
  registerLocalAuthRoutes({ post: vi.fn((path, callback) => { if (path === "/api/auth/register") handler = callback; }) } as any);
  if (!handler) throw new Error("Rota de cadastro não registrada.");
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
    await registerHandler()({ body: { name: "A", email: "invalido", password: "curta" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Informe nome, e-mail e senha com ao menos 10 caracteres." });
    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });

  it("impede cadastro duplicado sem alterar a conta existente", async () => {
    mocks.getUserByEmail.mockResolvedValue({ id: 1, email: "existente@example.com" });
    const res = response();
    await registerHandler()({ body: { name: "Pessoa Existente", email: "EXISTENTE@example.com", password: "senha-segura" } }, res);
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

    await registerHandler()({ protocol: "https", body: { name: " Novo Jogador ", email: "NOVO@example.com", password: "senha-segura" } }, res);

    expect(mocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo Jogador", email: "novo@example.com", role: "user" }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(expect.any(String), "session-token", expect.objectContaining({ httpOnly: true }));
    expect(res.json).toHaveBeenCalledWith({ id: 2, name: "Novo Jogador", email: "novo@example.com", role: "user" });
  });
});
