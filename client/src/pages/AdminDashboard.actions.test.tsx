// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  useUtils: vi.fn(),
  overview: vi.fn(),
  monthlySales: vi.fn(),
  exportOrders: vi.fn(),
  categories: vi.fn(),
  products: vi.fn(),
  orders: vi.fn(),
  deliveries: vi.fn(),
  servers: vi.fn(),
  coupons: vi.fn(),
  users: vi.fn(),
  createCategory: vi.fn(),
  createServer: vi.fn(),
  createProduct: vi.fn(),
  createCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  productStatus: vi.fn(),
  roleChange: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: mocks.useUtils,
    admin: {
      overview: { useQuery: mocks.overview },
      monthlySales: { useQuery: mocks.monthlySales },
      exportOrders: { useQuery: mocks.exportOrders },
      categories: { useQuery: mocks.categories },
      products: { useQuery: mocks.products },
      orders: { useQuery: mocks.orders },
      deliveries: { useQuery: mocks.deliveries },
      servers: { useQuery: mocks.servers },
      coupons: { useQuery: mocks.coupons },
      users: { useQuery: mocks.users },
      createCategory: { useMutation: mocks.createCategory },
      createServer: { useMutation: mocks.createServer },
      createProduct: { useMutation: mocks.createProduct },
      createCoupon: { useMutation: mocks.createCoupon },
      deleteCoupon: { useMutation: mocks.deleteCoupon },
      setProductStatus: { useMutation: mocks.productStatus },
      setUserRole: { useMutation: mocks.roleChange },
    },
  },
}));

import AdminDashboard from "./AdminDashboard";

const mutation = { mutate: vi.fn(), isPending: false };
const query = (data: unknown) => ({ data, isError: false, isLoading: false, refetch: vi.fn() });
const invalidate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: { id: 1, role: "admin", name: "Administrador" }, loading: false });
  mocks.useUtils.mockReturnValue({
    admin: { overview: invalidate, categories: invalidate, products: invalidate, orders: invalidate, deliveries: invalidate, servers: invalidate, coupons: invalidate, users: invalidate },
    catalog: { categories: invalidate, products: invalidate },
  });
  mocks.overview.mockReturnValue(query({ salesTodayCents: 0, salesMonthCents: 1090, pendingOrders: 2, pendingDeliveries: 0, failedDeliveries: 0, playerCount: 1 }));
  mocks.monthlySales.mockReturnValue(query([{ key: "2026-08", label: "ago", salesCents: 1090, paidOrders: 2 }]));
  mocks.exportOrders.mockReturnValue({ ...query([]), isFetching: false });
  mocks.categories.mockReturnValue(query([{ id: 1, name: "Cash", slug: "cash", active: true }]));
  mocks.products.mockReturnValue(query([{ id: 7, name: "1.000 Cash", categoryName: "Cash", priceCents: 490, active: true }]));
  mocks.orders.mockReturnValue(query([{ id: "order-1", orderNumber: "PSC-1", playerName: "_Nube", totalCents: 490, status: "WAITING_PAYMENT" }]));
  mocks.deliveries.mockReturnValue(query([]));
  mocks.servers.mockReturnValue(query([{ id: 2, name: "PlayStorCraft", active: true }]));
  mocks.coupons.mockReturnValue(query([]));
  mocks.users.mockReturnValue(query([{ id: 1, name: "Administrador", role: "admin" }]));
  [mocks.createCategory, mocks.createServer, mocks.createProduct, mocks.createCoupon, mocks.deleteCoupon, mocks.productStatus, mocks.roleChange].forEach(mock => mock.mockReturnValue(mutation));
});

describe("atalhos da visão administrativa", () => {
  it("abre o fluxo guiado de criação de produto", () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getAllByRole("button", { name: "Novo produto" })[0]);
    expect(screen.getByRole("heading", { name: "Novo produto" })).toBeInTheDocument();
    expect(screen.getByText("Defina preço, destino e comando de entrega antes de publicar.")).toBeInTheDocument();
  });

  it("mantém disponível o atalho para pausar um produto ativo", () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Pausar venda" }));
    expect(mutation.mutate).toHaveBeenCalledWith({ id: 7, active: false });
  });
});
