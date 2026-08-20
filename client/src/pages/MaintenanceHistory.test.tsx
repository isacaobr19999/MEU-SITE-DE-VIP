// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ history: vi.fn() }));

vi.mock("@/lib/trpc", () => ({ trpc: { store: { maintenanceHistory: { useQuery: mocks.history } } } }));

import MaintenanceHistory from "./MaintenanceHistory";

describe("MaintenanceHistory", () => {
  it("mostra apenas o resumo público de manutenções concluídas", () => {
    mocks.history.mockReturnValue({ data: [{ eventType: "ENDED", mode: "CLOSED", scheduledStartAt: "2026-08-20T14:00:00.000Z", scheduledEndAt: "2026-08-20T15:00:00.000Z", completedAt: "2026-08-20T15:02:00.000Z" }], isLoading: false, isError: false, refetch: vi.fn() });
    render(<MaintenanceHistory />);

    expect(screen.getByRole("heading", { name: "Histórico de manutenções" })).toBeInTheDocument();
    expect(screen.getByText("Manutenção concluída")).toBeInTheDocument();
    expect(screen.queryByText(/Motivo interno/i)).not.toBeInTheDocument();
  });
});
