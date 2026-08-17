// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("./BrandMark", () => ({ BrandMark: () => <div>PlayStorCraft</div> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useLocation: () => ["/", vi.fn()] }));

import { StoreHeader } from "./StoreHeader";

describe("StoreHeader", () => {
  it("dispara a abertura do carrinho quando a vitrine fornece a ação", () => {
    const onCart = vi.fn();
    render(<StoreHeader itemCount={1} onCart={onCart} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir carrinho" }));

    expect(onCart).toHaveBeenCalledOnce();
  });
});
