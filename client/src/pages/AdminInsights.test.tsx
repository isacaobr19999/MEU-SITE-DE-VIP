// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), report: vi.fn(), metrics: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { performanceReport: { useQuery: mocks.report }, metricsByPeriod: { useQuery: mocks.metrics } } } }));

import AdminInsights from "./AdminInsights";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });

describe("relatórios administrativos", () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
    mocks.metrics.mockReturnValue(query({ salesCents: 1590, paidOrders: 3, averageOrderCents: 530 }));
    mocks.report.mockReturnValue(query({ topProducts: [{ productName: "VIP Mestre", units: 3, revenueCents: 1590 }], coupons: [{ couponId: 9, code: "PLAY10", uses: 2, discountCents: 300, revenueCents: 1200 }], deliveryStatus: [{ status: "COMPLETED", total: 3 }] }));
  });

  it("exibe somente métricas confirmadas de produtos, cupons e entregas", () => {
    render(<AdminInsights />);
    expect(screen.getByText("Resultados claros, sem dados inventados.")).toBeInTheDocument();
    expect(screen.getByText("VIP Mestre")).toBeInTheDocument();
    expect(screen.getByText("PLAY10")).toBeInTheDocument();
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });
});
