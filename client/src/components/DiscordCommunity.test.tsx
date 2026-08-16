// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ status: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { community: { status: { useQuery: mocks.status } } } }));

import { DiscordCommunity } from "./DiscordCommunity";

describe("DiscordCommunity", () => {
  it("mostra estado seguro enquanto o bot ainda não publicou o convite", () => {
    mocks.status.mockReturnValue({ data: null, isLoading: false });
    render(<DiscordCommunity />);
    expect(screen.getByText("Convite em configuração")).toBeDisabled();
    expect(screen.getByText("Aguardando dados do servidor")).toBeInTheDocument();
  });

  it("exibe a comunidade e o convite publicados pelo bot", () => {
    mocks.status.mockReturnValue({ data: { discordName: "Discord PlayStorCraft", discordIconUrl: null, discordInviteUrl: "https://discord.gg/playstorcraft", discordMemberCount: 220, discordOnlineCount: 32, discordOnline: true, minecraftStatus: "ONLINE", minecraftPlayersOnline: 9, minecraftPlayersMax: 100, minecraftMotd: "Aventura online", minecraftVersion: "Paper 1.21.x" }, isLoading: false });
    render(<DiscordCommunity />);
    expect(screen.getByText("Discord PlayStorCraft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /entrar no discord/i })).toHaveAttribute("href", "https://discord.gg/playstorcraft");
    expect(screen.getByText("9/100")).toBeInTheDocument();
  });
});
