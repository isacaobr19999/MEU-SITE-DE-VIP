// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), attempts: vi.fn(), useUtils: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: mocks.useUtils, admin: { loginAttempts: { useQuery: mocks.attempts }, maintenanceControl: { useQuery: vi.fn() }, setManualMaintenance: { useMutation: vi.fn() }, scheduleMaintenance: { useMutation: vi.fn() }, cancelMaintenanceSchedule: { useMutation: vi.fn() }, sendMaintenanceNotificationTest: { useMutation: vi.fn() } } } }));

import MaintenanceSecurity from "./MaintenanceSecurity";

afterEach(cleanup);

describe("MaintenanceSecurity", () => {
  it("mostra o histórico minimizado somente para administrador", () => {
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
    mocks.attempts.mockReturnValue({ data: [{ id: "attempt-1", emailHint: "a•••@example.com", outcome: "FAILED", method: "PASSWORD", createdAt: new Date("2026-08-20T18:00:00.000Z") }], isLoading: false });
    render(<MaintenanceSecurity />);
    expect(screen.getByRole("heading", { name: "Auditoria de acesso" })).toBeInTheDocument();
    expect(screen.getByText("a•••@example.com")).toBeInTheDocument();
    expect(screen.getByText("Recusado")).toBeInTheDocument();
  });

  it("bloqueia usuário autenticado sem função administrativa", () => {
    mocks.auth.mockReturnValue({ user: { id: 2, role: "user" }, loading: false });
    render(<MaintenanceSecurity />);
    expect(screen.getByRole("heading", { name: "Acesso não autorizado" })).toBeInTheDocument();
  });
});
