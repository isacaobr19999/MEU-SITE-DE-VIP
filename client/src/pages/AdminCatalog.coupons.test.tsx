// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  useUtils: vi.fn(),
  categories: vi.fn(),
  products: vi.fn(),
  servers: vi.fn(),
  coupons: vi.fn(),
  updateCategory: vi.fn(),
  updateProduct: vi.fn(),
  updateServer: vi.fn(),
  updateCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
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
      deleteCoupon: { useMutation: mocks.deleteCoupon },
    },
  },
}));

import AdminCatalog from "./AdminCatalog";

const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
const mutation = { mutate: vi.fn(), isPending: false };
const invalidate = vi.fn();

describe("catálogo administrativo de cupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin", name: "Administrador" }, loading: false });
    mocks.useUtils.mockReturnValue({ admin: { categories: invalidate, products: invalidate, servers: invalidate, coupons: invalidate }, catalog: { categories: invalidate, products: invalidate } });
    mocks.categories.mockReturnValue(query([]));
    mocks.products.mockReturnValue(query([]));
    mocks.servers.mockReturnValue(query([]));
    mocks.coupons.mockReturnValue(query([{ id: 41, code: "TEMPO10", type: "PERCENTAGE", percentageBasisPoints: 1000, fixedDiscountCents: null, productIds: [], active: true, archivedAt: null, maxUses: 5, usedCount: 2, endsAt: "2099-08-31T18:00:00.000Z" }]));
    [mocks.updateCategory, mocks.updateProduct, mocks.updateServer, mocks.updateCoupon, mocks.deleteCoupon].forEach(mock => mock.mockReturnValue(mutation));
  });

  it("mantém hooks estáveis após o carregamento e confirma a exclusão", () => {
    let auth: { user: { id: number; role: "admin"; name: string } | null; loading: boolean } = { user: null, loading: true };
    mocks.auth.mockImplementation(() => auth);
    const { rerender } = render(<AdminCatalog />);

    auth = { user: { id: 1, role: "admin", name: "Administrador" }, loading: false };
    rerender(<AdminCatalog />);

    expect(screen.getByText(/Expira em/)).toBeInTheDocument();
    expect(screen.getByText("ATIVO")).toBeInTheDocument();
    expect(screen.getByText(/usos: 2\/5/)).toBeInTheDocument();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("TEMPO10"));
    expect(mutation.mutate).toHaveBeenCalledWith({ id: 41 });
  });
});
