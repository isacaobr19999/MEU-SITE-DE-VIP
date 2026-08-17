import { eq } from "drizzle-orm";
import { communityStatus } from "../../drizzle/schema";
import { requireDb } from "../db";

export type CommunityStatusInput = {
  discord: {
    guildId?: string;
    name?: string;
    iconUrl?: string;
    inviteUrl?: string;
    memberCount?: number;
    onlineCount?: number;
    online: boolean;
  };
  minecraft: {
    status: "UNKNOWN" | "ONLINE" | "OFFLINE" | "MAINTENANCE";
    playersOnline?: number;
    playersMax?: number;
    motd?: string;
    version?: string;
  };
  sourceUpdatedAt?: Date;
};

export async function getPublicCommunityStatus() {
  const db = await requireDb();
  const [row] = await db.select({
    discordName: communityStatus.discordName,
    discordIconUrl: communityStatus.discordIconUrl,
    discordInviteUrl: communityStatus.discordInviteUrl,
    discordMemberCount: communityStatus.discordMemberCount,
    discordOnlineCount: communityStatus.discordOnlineCount,
    discordOnline: communityStatus.discordOnline,
    minecraftStatus: communityStatus.minecraftStatus,
    minecraftPlayersOnline: communityStatus.minecraftPlayersOnline,
    minecraftPlayersMax: communityStatus.minecraftPlayersMax,
    minecraftMotd: communityStatus.minecraftMotd,
    minecraftVersion: communityStatus.minecraftVersion,
    updatedAt: communityStatus.updatedAt,
  }).from(communityStatus).where(eq(communityStatus.id, 1)).limit(1);
  return row ?? null;
}

export async function upsertCommunityStatus(input: CommunityStatusInput) {
  const db = await requireDb();
  const [current] = await db.select().from(communityStatus).where(eq(communityStatus.id, 1)).limit(1);
  const values = {
    id: 1,
    discordGuildId: input.discord.guildId ?? current?.discordGuildId ?? null,
    discordName: input.discord.name ?? current?.discordName ?? null,
    discordIconUrl: input.discord.iconUrl ?? current?.discordIconUrl ?? null,
    discordInviteUrl: input.discord.inviteUrl ?? current?.discordInviteUrl ?? null,
    discordMemberCount: input.discord.memberCount ?? current?.discordMemberCount ?? null,
    discordOnlineCount: input.discord.onlineCount ?? current?.discordOnlineCount ?? null,
    discordOnline: input.discord.online,
    minecraftStatus: input.minecraft.status,
    minecraftPlayersOnline: input.minecraft.playersOnline ?? current?.minecraftPlayersOnline ?? null,
    minecraftPlayersMax: input.minecraft.playersMax ?? current?.minecraftPlayersMax ?? null,
    minecraftMotd: input.minecraft.motd ?? current?.minecraftMotd ?? null,
    minecraftVersion: input.minecraft.version ?? current?.minecraftVersion ?? null,
    sourceUpdatedAt: input.sourceUpdatedAt ?? current?.sourceUpdatedAt ?? null,
  };
  await db.insert(communityStatus).values(values).onDuplicateKeyUpdate({ set: values });
  return getPublicCommunityStatus();
}

export async function updateCommunityInvite(inviteUrl: string | null) {
  const db = await requireDb();
  const defaults = { id: 1, discordInviteUrl: inviteUrl, discordOnline: false, minecraftStatus: "UNKNOWN" as const };
  await db.insert(communityStatus).values(defaults).onDuplicateKeyUpdate({ set: { discordInviteUrl: inviteUrl } });
  return getPublicCommunityStatus();
}
