// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/login", navigate] };
});

import Login from "./Login";

describe("Login", () => {
  it("mostra o acesso e alterna para o cadastro com requisitos de senha", () => {
    render(<Login />);
    expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));
    expect(screen.getByRole("heading", { name: "Crie sua conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("minLength", "10");
  });
});
