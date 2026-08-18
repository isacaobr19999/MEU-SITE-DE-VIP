// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  useUtils: vi.fn(),
  orders: vi.fn(), deliveries: vi.fn(), players: vi.fn(), logs: vi.fn(), servers: vi.fn(), coupons: vi.fn(), categories: vi.fn(), orderDetail: vi.fn(), playerHistory: vi.fn(),
  cancelOrder: vi.fn(), retryDelivery: vi.fn(), updateServer: vi.fn(), updateCoupon: vi.fn(), updateCategory: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: { useUtils: mocks.useUtils, admin: {
    orders: { useQuery: mocks.orders }, deliveries: { useQuery: mocks.deliveries }, players: { useQuery: mocks.players }, logs: { useQuery: mocks.logs }, servers: { useQuery: mocks.servers }, coupons: { useQuery: mocks.coupons }, categories: { useQuery: mocks.categories }, orderDetail: { useQuery: mocks.orderDetail }, playerHistory: { useQuery: mocks.playerHistory },
    cancelOrder: { useMutation: mocks.cancelOrder }, retryDelivery: { useMutation: mocks.retryDelivery }, updateServer: { useMutation: mocks.updateServer }, updateCoupon: { useMutation: mocks.updateCoupon }, updateCategory: { useMutation: mocks.updateCategory },
  } },
}));

import AdminOperations from "./AdminOperations";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
const mutation = { mutate: vi.fn(), isPending: false };
const invalidate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
  mocks.useUtils.mockReturnValue({ admin: { orders: invalidate, overview: invalidate, deliveries: invalidate, servers: invalidate, coupons: invalidate, categories: invalidate }, catalog: { categories: invalidate } });
  mocks.orders.mockReturnValue(query([]));
  mocks.deliveries.mockReturnValue(query([
    { id: "delivery-1", status: "FAILED", attemptCount: 3, maxAttempts: 8, lastError: "Servidor indisponível", orderNumber: "PSC-FAIL", playerName: "FalhaPlayer", serverName: "PlayStorCraft" },
    { id: "delivery-2", status: "COMPLETED", attemptCount: 1, maxAttempts: 8, lastError: null, orderNumber: "PSC-OK", playerName: "ConcluidoPlayer", serverName: "PlayStorCraft" },
  ]));
  [mocks.players, mocks.logs, mocks.servers, mocks.coupons, mocks.categories].forEach(mock => mock.mockReturnValue(query([])));
  mocks.orderDetail.mockReturnValue(query(undefined));
  mocks.playerHistory.mockReturnValue(query([]));
  [mocks.cancelOrder, mocks.retryDelivery, mocks.updateServer, mocks.updateCoupon, mocks.updateCategory].forEach(mock => mock.mockReturnValue(mutation));
});

describe("filtros da fila de entregas", () => {
  it("prioriza entregas com falha ao usar o cartão de atenção", () => {
    render(<AdminOperations />);
    expect(screen.getByText("ConcluidoPlayer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Com falha/i }));
    expect(screen.getByText("FalhaPlayer")).toBeInTheDocument();
    expect(screen.queryByText("ConcluidoPlayer")).not.toBeInTheDocument();
    expect(screen.getByText("Servidor indisponível")).toBeInTheDocument();
  });
});
