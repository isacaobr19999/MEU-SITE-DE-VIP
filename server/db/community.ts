import { count, eq, inArray } from "drizzle-orm";
import { communityStatus, deliveries, orders } from "../../drizzle/schema";
import { requireDb } from "../db";

export type CommunityStatusInput = {
  discord: {
    guildId?: string;
    name?: string;
    iconUrl?: string;
    inviteUrl?: string;
    memberCount?: number;
    onlineCount?: number;
    online?: boolean;
  };
  minecraft: {
    status?: "UNKNOWN" | "ONLINE" | "OFFLINE" | "MAINTENANCE";
    playersOnline?: number;
    playersMax?: number;
    motd?: string;
    version?: string;
  };
  sourceUpdatedAt?: Date;
};

const MINECRAFT_STATUS_TTL_MS = 3 * 60 * 1000;

export function isMinecraftStatusFresh(updatedAt: Date | null | undefined, now = Date.now()) {
  return Boolean(updatedAt && now - updatedAt.getTime() <= MINECRAFT_STATUS_TTL_MS);
}

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
    minecraftUpdatedAt: communityStatus.minecraftUpdatedAt,
    updatedAt: communityStatus.updatedAt,
  }).from(communityStatus).where(eq(communityStatus.id, 1)).limit(1);
  if (!row) return null;
  if (row.minecraftStatus === "ONLINE" && !isMinecraftStatusFresh(row.minecraftUpdatedAt)) {
    return { ...row, minecraftStatus: "OFFLINE" as const, minecraftPlayersOnline: 0 };
  }
  return row;
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
    discordOnline: input.discord.online ?? current?.discordOnline ?? false,
    minecraftStatus: input.minecraft.status ?? current?.minecraftStatus ?? "UNKNOWN",
    minecraftPlayersOnline: input.minecraft.playersOnline ?? current?.minecraftPlayersOnline ?? null,
    minecraftPlayersMax: input.minecraft.playersMax ?? current?.minecraftPlayersMax ?? null,
    minecraftMotd: input.minecraft.motd ?? current?.minecraftMotd ?? null,
    minecraftVersion: input.minecraft.version ?? current?.minecraftVersion ?? null,
    minecraftUpdatedAt: input.minecraft.status ? input.sourceUpdatedAt ?? new Date() : current?.minecraftUpdatedAt ?? null,
    sourceUpdatedAt: input.sourceUpdatedAt ?? current?.sourceUpdatedAt ?? null,
  };
  await db.insert(communityStatus).values(values).onDuplicateKeyUpdate({ set: values });
  return getPublicCommunityStatus();
}

export async function getPublicOperationsStatus() {
  const db = await requireDb();
  const [pendingOrders, settledOrders, pendingDeliveries, failedDeliveries] = await Promise.all([
    db.select({ value: count() }).from(orders).where(inArray(orders.status, ["PENDING", "WAITING_PAYMENT", "PAID", "PROCESSING"])),
    db.select({ value: count() }).from(orders).where(inArray(orders.status, ["PAID", "PROCESSING", "COMPLETED"])),
    db.select({ value: count() }).from(deliveries).where(inArray(deliveries.status, ["PENDING", "RETRYING", "CLAIMED", "PROCESSING"])),
    db.select({ value: count() }).from(deliveries).where(inArray(deliveries.status, ["FAILED"])),
  ]);
  const pendingOrderCount = Number(pendingOrders[0]?.value ?? 0);
  const settledOrderCount = Number(settledOrders[0]?.value ?? 0);
  const pendingDeliveryCount = Number(pendingDeliveries[0]?.value ?? 0);
  const failedDeliveryCount = Number(failedDeliveries[0]?.value ?? 0);
  return {
    refreshedAt: new Date().toISOString(),
    payments: { status: "MONITORED" as const, pendingOrders: pendingOrderCount, settledOrders: settledOrderCount },
    deliveries: { status: failedDeliveryCount > 0 ? "ATTENTION" as const : "OPERATIONAL" as const, pending: pendingDeliveryCount, failed: failedDeliveryCount },
  };
}

export async function updateCommunityInvite(inviteUrl: string | null) {
  const db = await requireDb();
  const defaults = { id: 1, discordInviteUrl: inviteUrl, discordOnline: false, minecraftStatus: "UNKNOWN" as const };
  await db.insert(communityStatus).values(defaults).onDuplicateKeyUpdate({ set: { discordInviteUrl: inviteUrl } });
  return getPublicCommunityStatus();
}
