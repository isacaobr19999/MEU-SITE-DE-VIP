// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ posts: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { community: { posts: { useQuery: mocks.posts } } } }));
vi.mock("@/components/StoreHeader", () => ({ StoreHeader: () => <header>PlayStorCraft</header> }));

import { CommunityContent } from "./CommunityContent";

describe("CommunityContent", () => {
  it("apresenta um estado vazio claro quando ainda não existem regras publicadas", () => {
    mocks.posts.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<CommunityContent kind="RULE" />);
    expect(screen.getByText("Regras para uma aventura justa.")).toBeInTheDocument();
    expect(screen.getByText("As regras oficiais serão publicadas pela administração em breve.")).toBeInTheDocument();
  });

  it("exibe uma novidade publicada com resumo, conteúdo e data", () => {
    mocks.posts.mockReturnValue({ data: [{ id: 1, title: "Temporada de aventura", summary: "Prepare seu inventário.", body: "O evento começa neste fim de semana.", publishedAt: new Date("2026-08-17T00:00:00.000Z"), updatedAt: new Date() }], isLoading: false, isError: false });
    render(<CommunityContent kind="NEWS" />);
    expect(screen.getByText("Temporada de aventura")).toBeInTheDocument();
    expect(screen.getByText("Prepare seu inventário.")).toBeInTheDocument();
    expect(screen.getByText("O evento começa neste fim de semana.")).toBeInTheDocument();
  });
});
