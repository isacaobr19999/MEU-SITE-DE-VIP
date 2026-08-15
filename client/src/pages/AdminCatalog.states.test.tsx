// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  categories: vi.fn(),
  products: vi.fn(),
  servers: vi.fn(),
  coupons: vi.fn(),
  useUtils: vi.fn(),
  updateCategory: vi.fn(),
  updateProduct: vi.fn(),
  updateServer: vi.fn(),
  updateCoupon: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: mocks.useUtils,
    admin: {
      categories: { useQuery: mocks.categories },
      products: { useQuery: mocks.products },
      servers: { useQuery: mocks.servers },
      coupons: { useQuery: mocks.coupons },
      updateCategory: { useMutation: mocks.updateCategory },
      updateProduct: { useMutation: mocks.updateProduct },
      updateServer: { useMutation: mocks.updateServer },
      updateCoupon: { useMutation: mocks.updateCoupon },
    },
  },
}));

import AdminCatalog from "./AdminCatalog";

const mutation = { mutate: vi.fn(), isPending: false };
const invalidation = { invalidate: vi.fn() };
const query = (overrides: Record<string, unknown> = {}) => ({ data: [], isLoading: false, isError: false, refetch: vi.fn(), ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" }, loading: false });
  mocks.categories.mockReturnValue(query());
  mocks.products.mockReturnValue(query());
  mocks.servers.mockReturnValue(query());
  mocks.coupons.mockReturnValue(query());
  mocks.updateCategory.mockReturnValue(mutation);
  mocks.updateProduct.mockReturnValue(mutation);
  mocks.updateServer.mockReturnValue(mutation);
  mocks.updateCoupon.mockReturnValue(mutation);
  mocks.useUtils.mockReturnValue({
    admin: { categories: invalidation, products: invalidation, servers: invalidation, coupons: invalidation },
    catalog: { categories: invalidation, products: invalidation },
  });
});

describe("estados recuperáveis do catálogo administrativo", () => {
  it("exibe carregamento enquanto as consultas administrativas estão pendentes", () => {
    mocks.categories.mockReturnValue(query({ isLoading: true }));
    render(<AdminCatalog />);
    expect(screen.getByText("Carregando o catálogo administrativo")).toBeInTheDocument();
  });

  it("exibe erro e refaz todas as consultas ao usar Tentar novamente", () => {
    const categories = query({ isError: true });
    const products = query();
    const servers = query();
    const coupons = query();
    mocks.categories.mockReturnValue(categories);
    mocks.products.mockReturnValue(products);
    mocks.servers.mockReturnValue(servers);
    mocks.coupons.mockReturnValue(coupons);

    render(<AdminCatalog />);
    expect(screen.getByText("Não foi possível carregar o catálogo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(categories.refetch).toHaveBeenCalledOnce();
    expect(products.refetch).toHaveBeenCalledOnce();
    expect(servers.refetch).toHaveBeenCalledOnce();
    expect(coupons.refetch).toHaveBeenCalledOnce();
  });
});
