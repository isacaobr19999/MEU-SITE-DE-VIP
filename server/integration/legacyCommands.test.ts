import { describe, expect, it, vi } from "vitest";
import { buildLinkConfirmationMessage, listPendingLegacyCommands, reportLegacyCommandResult } from "./legacyCommands";

function responseMock() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

function requestMock(headers: Record<string, string>, body: unknown = {}) {
  return {
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name],
    body,
  } as never;
}

describe("fila de confirmação Discord–Minecraft", () => {
  it("constrói uma mensagem explícita para o jogador", () => {
    expect(buildLinkConfirmationMessage("_Nube")).toBe("Conta Minecraft vinculada com sucesso: _Nube.");
  });

  it("rejeita polling sem a chave de integração antes de consultar o banco", async () => {
    const response = responseMock();
    await listPendingLegacyCommands(requestMock({}), response as never);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ commands: [], error: "UNAUTHORIZED" });
  });

  it("rejeita resultado sem a chave de integração", async () => {
    const response = responseMock();
    await reportLegacyCommandResult(requestMock({}, { eventId: "event-1", success: true }), response as never);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ accepted: false, error: "UNAUTHORIZED" });
  });
});
