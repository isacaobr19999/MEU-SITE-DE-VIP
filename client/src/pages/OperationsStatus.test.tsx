// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ operations: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { community: { operations: { useQuery: mocks.operations } } } }));
vi.mock("@/components/StoreHeader", () => ({ StoreHeader: () => <header>PlayStorCraft</header> }));

import OperationsStatus from "./OperationsStatus";

describe("OperationsStatus", () => {
  it("apresenta os quatro eixos operacionais com os dados públicos", () => {
    mocks.operations.mockReturnValue({
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
      data: {
        community: { discordName: "PlayCraftBR", discordOnline: true, discordMemberCount: 42, discordOnlineCount: 7, discordInviteUrl: "https://discord.gg/example", minecraftStatus: "ONLINE", minecraftMotd: "Servidor ativo", minecraftPlayersOnline: 3, minecraftPlayersMax: 20, minecraftVersion: "1.21.x", minecraftTpsMilli: 19_980, minecraftMsptMicros: 50_200 },
        operations: { refreshedAt: "2026-08-17T12:00:00.000Z", payments: { status: "MONITORED", pendingOrders: 2, settledOrders: 18 }, deliveries: { status: "OPERATIONAL", pending: 1, failed: 0 } },
      },
    });
    render(<OperationsStatus />);
    expect(screen.getByText("Status da PlayStorCraft")).toBeInTheDocument();
    expect(screen.getByText("PlayCraftBR")).toBeInTheDocument();
    expect(screen.getByText("Servidor PlayStorCraft")).toBeInTheDocument();
    expect(screen.getByText("Operação monitorada")).toBeInTheDocument();
    expect(screen.getByText("Distribuição no servidor")).toBeInTheDocument();
    expect(screen.getByText("3/20")).toBeInTheDocument();
    expect(screen.getByText("19.98")).toBeInTheDocument();
    expect(screen.getByText("50.20")).toBeInTheDocument();
    expect(mocks.operations).toHaveBeenCalledWith(undefined, expect.objectContaining({ refetchInterval: 30_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true }));
  });

  it("mostra uma falha recuperável quando o status não pode ser carregado", () => {
    mocks.operations.mockReturnValue({ isFetching: false, isError: true, refetch: vi.fn(), data: undefined });
    render(<OperationsStatus />);
    expect(screen.getByText("Não foi possível carregar o status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
