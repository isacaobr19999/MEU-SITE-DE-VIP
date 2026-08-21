// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categories: vi.fn(),
  products: vi.fn(),
  promotions: vi.fn(),
  product: vi.fn(),
  productServers: vi.fn(),
  createOrder: vi.fn(),
  checkout: vi.fn(),
  mine: vi.fn(),
  byId: vi.fn(),
  auth: vi.fn(),
  community: vi.fn(),
  ranking: vi.fn(),
  availability: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: {
      categories: { useQuery: mocks.categories },
      products: { useQuery: mocks.products },
      promotions: { useQuery: mocks.promotions },
      product: { useQuery: mocks.product },
      productServers: { useQuery: mocks.productServers },
    },
    orders: {
      create: { useMutation: mocks.createOrder },
      checkout: { useMutation: mocks.checkout },
      mine: { useQuery: mocks.mine },
      byId: { useQuery: mocks.byId },
    },
    community: { status: { useQuery: mocks.community }, ranking: { useQuery: mocks.ranking } },
    store: { availability: { useQuery: mocks.availability } },
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useRoute: () => [true, { slug: "vip-ouro", id: "11111111-1111-1111-1111-111111111111" }] };
});

import Home from "./Home";
import OrderDetail from "./OrderDetail";
import OrderHistory from "./OrderHistory";
import ProductDetail from "./ProductDetail";

const queryIdle = { data: undefined, isLoading: false, isError: false, refetch: vi.fn() };
const emptyProducts: unknown[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: null, loading: false, isAuthenticated: false });
  mocks.categories.mockReturnValue({ ...queryIdle, data: [] });
  mocks.products.mockImplementation(() => ({ ...queryIdle, data: emptyProducts }));
  mocks.promotions.mockReturnValue({ ...queryIdle, data: [] });
  mocks.product.mockReturnValue({ ...queryIdle, data: undefined });
  mocks.productServers.mockReturnValue({ ...queryIdle, data: [] });
  mocks.createOrder.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.checkout.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.mine.mockReturnValue({ ...queryIdle, data: [] });
  mocks.byId.mockReturnValue({ ...queryIdle, data: undefined });
  mocks.community.mockReturnValue({ ...queryIdle, data: null });
  mocks.ranking.mockReturnValue({ ...queryIdle, data: [] });
  mocks.availability.mockReturnValue({ ...queryIdle, data: { publicOnline: true, maintenanceMode: "CLOSED" } });
});

describe("páginas de comércio em runtime", () => {
  it("exibe loading, vazio e erro no catálogo", () => {
    mocks.products.mockImplementation((input?: { featuredOnly?: boolean }) => input?.featuredOnly ? { ...queryIdle, data: emptyProducts } : { ...queryIdle, isLoading: true });
    const loadingView = render(<Home />);
    expect(loadingView.container.querySelector(".animate-spin")).toBeInTheDocument();
    loadingView.unmount();

    mocks.products.mockImplementation(() => ({ ...queryIdle, data: emptyProducts }));
    const emptyView = render(<Home />);
    expect(screen.getByText("A loja está sendo preparada")).toBeInTheDocument();
    emptyView.unmount();

    mocks.products.mockImplementation((input?: { featuredOnly?: boolean }) => input?.featuredOnly ? { ...queryIdle, data: emptyProducts } : { ...queryIdle, isError: true });
    render(<Home />);
    expect(screen.getByText("Não foi possível carregar o catálogo")).toBeInTheDocument();
  });

  it("mantém o carrinho utilizável enquanto o catálogo está carregando", () => {
    window.history.pushState({}, "", "/cart");
    mocks.products.mockImplementation((input?: { featuredOnly?: boolean }) => input?.featuredOnly ? { ...queryIdle, data: emptyProducts } : { ...queryIdle, isLoading: true });

    const cartView = render(<Home />);

    expect(cartView.getAllByRole("heading", { name: "Carrinho de benefícios" }).length).toBeGreaterThan(0);
    expect(cartView.getAllByText("Seu inventário está vazio.").length).toBeGreaterThan(0);
    expect(cartView.getAllByText("Entrar para continuar").length).toBeGreaterThan(0);
    expect(cartView.container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("diferencia erro de produto de produto inexistente", () => {
    mocks.product.mockReturnValue({ ...queryIdle, isError: true });
    const errorView = render(<ProductDetail />);
    expect(screen.getByText("Não foi possível carregar este benefício")).toBeInTheDocument();
    errorView.unmount();

    mocks.product.mockReturnValue({ ...queryIdle, data: undefined });
    render(<ProductDetail />);
    expect(screen.getByText("Benefício não encontrado")).toBeInTheDocument();
  });

  it("exibe erro recuperável no histórico de pedidos", () => {
    mocks.auth.mockReturnValue({ user: { id: 1 }, loading: false, isAuthenticated: true });
    mocks.mine.mockReturnValue({ ...queryIdle, isError: true });
    render(<OrderHistory />);
    expect(screen.getByText("Não foi possível carregar seus pedidos")).toBeInTheDocument();
  });

  it("exibe erro recuperável no detalhe de pedido", () => {
    mocks.auth.mockReturnValue({ user: { id: 1 }, loading: false, isAuthenticated: true });
    mocks.byId.mockReturnValue({ ...queryIdle, isError: true });
    render(<OrderDetail />);
    expect(screen.getByText("Não foi possível carregar este pedido")).toBeInTheDocument();
  });
});
