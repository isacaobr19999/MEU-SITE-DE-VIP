// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("./BrandMark", () => ({ BrandMark: () => <div>PlayStorCraft</div> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useLocation: () => ["/", vi.fn()] }));

import { StoreHeader } from "./StoreHeader";

afterEach(cleanup);

describe("StoreHeader", () => {
  it("dispara a abertura do carrinho quando a vitrine fornece a ação", () => {
    const onCart = vi.fn();
    render(<StoreHeader itemCount={1} onCart={onCart} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir carrinho" }));

    expect(onCart).toHaveBeenCalledOnce();
  });

  it("abre as abas em um menu móvel acessível", () => {
    render(<StoreHeader />);

    const trigger = screen.getByRole("button", { name: "Abrir menu de navegação" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const navigation = screen.getByRole("navigation", { name: "Navegação móvel" });

    expect(within(navigation).getByRole("button", { name: "Entrar ou criar conta" })).toBeVisible();
    expect(within(navigation).getByText("Benefícios")).toBeVisible();
    expect(within(navigation).getByText("Como funciona")).toBeVisible();
  });
});
