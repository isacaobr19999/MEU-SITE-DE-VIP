// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), center: vi.fn(), monitoring: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { operationsCenter: { useQuery: mocks.center }, monitoring: { useQuery: mocks.monitoring } } } }));

import AdminCommandCenter from "./AdminCommandCenter";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

describe("central de comando administrativo", () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
    mocks.center.mockReturnValue(query({ overview: { salesTodayCents: 1090, salesMonthCents: 2500, pendingOrders: 1, pendingDeliveries: 1, failedDeliveries: 1, playerCount: 4 }, attentionDeliveries: [{ id: "00000000-0000-4000-8000-000000000123", status: "FAILED", attemptCount: 2, maxAttempts: 8, nextAttemptAt: new Date("2026-08-26T12:00:00Z"), updatedAt: new Date("2026-08-26T11:00:00Z"), lastError: "Paper indisponível", orderNumber: "PSC-10", playerName: "FalhaPlayer", playerId: 6, serverName: "Survival" }], recentOrders: [], recentAudit: [] }));
    mocks.monitoring.mockReturnValue(query({ services: [{ serviceKey: "minecraft", label: "Minecraft Paper", currentStatus: "ONLINE", lastCheckedAt: new Date("2026-08-26T11:00:00Z") }] }));
  });

  it("mostra pendências, saúde de serviços e permite atualização manual", () => {
    render(<AdminCommandCenter />);
    expect(screen.getByText("Uma leitura para agir com segurança.")).toBeInTheDocument();
    expect(screen.getByText("FalhaPlayer")).toBeInTheDocument();
    expect(screen.getByText("Minecraft Paper")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Atualizar agora" }));
    expect(mocks.center.mock.results[0]?.value.refetch).toHaveBeenCalledOnce();
    expect(mocks.monitoring.mock.results[0]?.value.refetch).toHaveBeenCalledOnce();
  });
});
