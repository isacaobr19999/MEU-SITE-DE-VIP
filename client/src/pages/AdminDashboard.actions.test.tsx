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
  storeAvailability: vi.fn(),
  createCategory: vi.fn(),
  createServer: vi.fn(),
  createProduct: vi.fn(),
  createCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  productStatus: vi.fn(),
  roleChange: vi.fn(),
  setStoreAvailability: vi.fn(),
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
      storeAvailability: { useQuery: mocks.storeAvailability },
      createCategory: { useMutation: mocks.createCategory },
      createServer: { useMutation: mocks.createServer },
      createProduct: { useMutation: mocks.createProduct },
      createCoupon: { useMutation: mocks.createCoupon },
      deleteCoupon: { useMutation: mocks.deleteCoupon },
      setProductStatus: { useMutation: mocks.productStatus },
      setUserRole: { useMutation: mocks.roleChange },
      setStoreAvailability: { useMutation: mocks.setStoreAvailability },
    },
    store: { availability: { useQuery: mocks.storeAvailability } },
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
    admin: { overview: invalidate, categories: invalidate, products: invalidate, orders: invalidate, deliveries: invalidate, servers: invalidate, coupons: invalidate, users: invalidate, storeAvailability: invalidate },
    store: { availability: invalidate },
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
  mocks.storeAvailability.mockReturnValue(query({ publicOnline: true, offlineMessage: "A loja está temporariamente em manutenção." }));
  [mocks.createCategory, mocks.createServer, mocks.createProduct, mocks.createCoupon, mocks.deleteCoupon, mocks.productStatus, mocks.roleChange, mocks.setStoreAvailability].forEach(mock => mock.mockReturnValue(mutation));
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

  it("confirma a exclusão de cupom antes de executar a ação", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.coupons.mockReturnValue(query([{ id: 15, code: "TEMPO10", type: "PERCENTAGE", percentageBasisPoints: 1000, endsAt: "2026-08-31T18:00:00.000Z" }]));
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("TEMPO10"));
    expect(mutation.mutate).toHaveBeenCalledWith({ id: 15 });
  });

  it("envia o limite total configurado ao criar uma campanha de cupom", () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getAllByRole("button", { name: "Novo cupom" })[0]);
    fireEvent.change(screen.getByPlaceholderText("PLAY10"), { target: { value: "LIMITE5" } });
    fireEvent.change(screen.getByPlaceholderText("10 para 10%"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Limite total de usos"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar cupom" }));

    expect(mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ code: "LIMITE5", percentageBasisPoints: 1000, maxUses: 5, maxUsesPerPlayer: 1, active: true }));
  });

  it("confirma antes de colocar a loja pública offline", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Deixar offline" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Colocar a loja offline"));
    expect(mutation.mutate).toHaveBeenCalledWith({ publicOnline: false, offlineMessage: "A loja está temporariamente em manutenção." });
  });
});
