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
  const values = {
    id: 1,
    discordGuildId: input.discord.guildId ?? null,
    discordName: input.discord.name ?? null,
    discordIconUrl: input.discord.iconUrl ?? null,
    discordInviteUrl: input.discord.inviteUrl ?? null,
    discordMemberCount: input.discord.memberCount ?? null,
    discordOnlineCount: input.discord.onlineCount ?? null,
    discordOnline: input.discord.online,
    minecraftStatus: input.minecraft.status,
    minecraftPlayersOnline: input.minecraft.playersOnline ?? null,
    minecraftPlayersMax: input.minecraft.playersMax ?? null,
    minecraftMotd: input.minecraft.motd ?? null,
    minecraftVersion: input.minecraft.version ?? null,
    sourceUpdatedAt: input.sourceUpdatedAt ?? null,
  };
  await db.insert(communityStatus).values(values).onDuplicateKeyUpdate({ set: values });
  return getPublicCommunityStatus();
}
