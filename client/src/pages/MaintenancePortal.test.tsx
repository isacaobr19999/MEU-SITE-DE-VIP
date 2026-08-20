// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), useUtils: vi.fn(), control: vi.fn(), setManual: vi.fn(), schedule: vi.fn(), cancel: vi.fn(), testNotice: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: mocks.useUtils, admin: { maintenanceControl: { useQuery: mocks.control }, setManualMaintenance: { useMutation: mocks.setManual }, scheduleMaintenance: { useMutation: mocks.schedule }, cancelMaintenanceSchedule: { useMutation: mocks.cancel }, sendMaintenanceNotificationTest: { useMutation: mocks.testNotice } } } }));

import MaintenancePortal from "./MaintenancePortal";

const mutation = { mutate: vi.fn(), isPending: false };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.useUtils.mockReturnValue({ admin: { maintenanceControl: { invalidate: vi.fn() }, storeAvailability: { invalidate: vi.fn() } }, store: { availability: { invalidate: vi.fn() } } });
  mocks.control.mockReturnValue({ data: { settings: { publicOnline: true, offlineMessage: "Manutenção rápida.", maintenanceMode: "CLOSED", maintenanceReason: null, scheduledStartAt: null, scheduledEndAt: null, scheduleStatus: "NONE" } }, isLoading: false });
  [mocks.setManual, mocks.schedule, mocks.cancel, mocks.testNotice].forEach(mock => mock.mockReturnValue(mutation));
});

describe("MaintenancePortal", () => {
  it("exibe login por e-mail e senha quando não há sessão", () => {
    mocks.auth.mockReturnValue({ user: null, loading: false });
    render(<MaintenancePortal />);
    expect(screen.getByRole("heading", { name: "Painel de manutenção" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar no painel" })).toBeInTheDocument();
  });

  it("bloqueia conta autenticada sem função administrativa", () => {
    mocks.auth.mockReturnValue({ user: { id: 2, role: "user" }, loading: false });
    render(<MaintenancePortal />);
    expect(screen.getByRole("heading", { name: "Acesso não autorizado" })).toBeInTheDocument();
  });

  it("oferece os controles isolados para uma conta administrativa", () => {
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
    render(<MaintenancePortal />);
    expect(screen.getByText("Loja online")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar manutenção" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agendar manutenção" })).toBeInTheDocument();
  });
});
