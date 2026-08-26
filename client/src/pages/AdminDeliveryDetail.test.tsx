// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), detail: vi.fn(), retry: vi.fn(), useUtils: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: mocks.useUtils, admin: { deliveryDetail: { useQuery: mocks.detail }, retryDelivery: { useMutation: mocks.retry } } } }));

import AdminDeliveryDetail from "./AdminDeliveryDetail";

describe("detalhe seguro de entrega", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/deliveries/00000000-0000-4000-8000-000000000123");
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
    mocks.useUtils.mockReturnValue({ admin: { deliveries: { invalidate: vi.fn() }, operationsCenter: { invalidate: vi.fn() } } });
    mocks.detail.mockReturnValue({ data: { delivery: { id: "00000000-0000-4000-8000-000000000123", status: "FAILED", attemptCount: 2, maxAttempts: 8, nextAttemptAt: new Date("2026-08-26T12:00:00Z"), completedAt: null, lastError: "Paper indisponível", commandTemplates: ["lp user {player} parent add mestre"], createdAt: new Date("2026-08-26T10:00:00Z"), updatedAt: new Date("2026-08-26T11:00:00Z"), orderId: "00000000-0000-4000-8000-000000000124", orderNumber: "PSC-10", orderStatus: "PROCESSING", playerId: 6, playerName: "FalhaPlayer", playerUuid: "00000000-0000-4000-8000-000000000125", productName: "VIP Mestre", durationDays: 30, serverName: "Survival", serverKind: "SURVIVAL" }, audit: [] }, isLoading: false, isError: false, refetch: vi.fn() });
    mocks.retry.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("pede confirmação antes de recolocar uma entrega com falha na fila", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminDeliveryDetail />);
    fireEvent.click(screen.getByRole("button", { name: "Reprocessar com segurança" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Reprocessar esta entrega"));
    expect(mocks.retry.mock.results[0]?.value.mutate).toHaveBeenCalledWith({ id: "00000000-0000-4000-8000-000000000123" });
  });
});
