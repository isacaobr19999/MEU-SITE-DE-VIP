import { Client, GatewayIntentBits } from "discord.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();
const bridgeSecret = process.env.DISCORD_BOT_BRIDGE_SECRET?.trim();
const bridgeUrl = process.env.PLAYSTORCRAFT_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/status";
const inviteUrl = process.env.DISCORD_INVITE_URL?.trim();
const inviteChannelId = process.env.DISCORD_INVITE_CHANNEL_ID?.trim();
const statusChannelId = process.env.DISCORD_STATUS_CHANNEL_ID?.trim();
const operationsChannelId = process.env.DISCORD_OPERATIONS_CHANNEL_ID?.trim();
const publicStatusUrl = process.env.PLAYSTORCRAFT_PUBLIC_STATUS_URL?.trim();
const operationsBridgeUrl = process.env.PLAYSTORCRAFT_OPERATIONS_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/operations";
const managedInviteEnabled = process.env.DISCORD_MANAGED_INVITE === "true";
const managedInvitePath = "/bot/data/community-invite.json";
const presenceEnabled = process.env.DISCORD_ENABLE_PRESENCE !== "false";
const publishIntervalMs = Math.max(60_000, Number(process.env.DISCORD_STATUS_INTERVAL_MS) || 90_000);

function keepDisabledServiceAlive() {
  console.warn("[Discord bot] Aguardando DISCORD_BOT_TOKEN, DISCORD_GUILD_ID e DISCORD_BOT_BRIDGE_SECRET no runtime. Nenhuma conexão com o Discord será aberta.");
  setInterval(() => console.info("[Discord bot] Serviço em espera por credenciais."), 6 * 60 * 60 * 1000);
}

if (!token || !bridgeSecret) {
  keepDisabledServiceAlive();
} else {
  const intents = [GatewayIntentBits.Guilds];
  if (presenceEnabled) intents.push(GatewayIntentBits.GuildPresences);
  const client = new Client({ intents });
  let publishTimer;
  let publishing = false;
  let lastPublishedAt = 0;
  let managedInviteUrl;
  let lastMinecraftMessage = "";

  async function readManagedInvite() {
    if (!managedInviteEnabled) return undefined;
    try {
      const saved = JSON.parse(await readFile(managedInvitePath, "utf8"));
      return typeof saved.url === "string" && saved.url.startsWith("https://discord.gg/") ? saved.url : undefined;
    } catch {
      return undefined;
    }
  }

  async function resolveInviteUrl(guild) {
    if (!managedInviteEnabled) return inviteUrl;
    if (managedInviteUrl) return managedInviteUrl;
    managedInviteUrl = await readManagedInvite();
    if (managedInviteUrl) return managedInviteUrl;

    const channel = inviteChannelId ? await guild.channels.fetch(inviteChannelId).catch(() => null) : guild.systemChannel;
    if (!channel || !channel.isTextBased() || typeof channel.createInvite !== "function") {
      throw new Error("O canal configurado para o convite não está disponível para o bot.");
    }
    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, temporary: false, unique: true, reason: "Convite permanente da PlayStorCraft" });
    managedInviteUrl = invite.url;
    await mkdir("/bot/data", { recursive: true });
    await writeFile(managedInvitePath, JSON.stringify({ url: managedInviteUrl }), { mode: 0o600 });
    console.info("[Discord bot] Convite permanente criado e armazenado com segurança.");
    return managedInviteUrl;
  }

  async function getInviteCounts(targetInviteUrl) {
    const code = targetInviteUrl?.match(/discord\.gg\/([A-Za-z0-9-]+)/i)?.[1];
    if (!code) return {};
    try {
      const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const invite = await response.json();
      return {
        memberCount: Number.isInteger(invite.approximate_member_count) ? invite.approximate_member_count : undefined,
        onlineCount: Number.isInteger(invite.approximate_presence_count) ? invite.approximate_presence_count : undefined,
      };
    } catch (error) {
      console.warn("[Discord bot] Não foi possível obter contagens públicas do convite; usando dados do servidor.", error instanceof Error ? error.message : error);
      return {};
    }
  }

  async function publishMinecraftStatus(guild) {
    if (!statusChannelId || !publicStatusUrl) return;
    const channel = await guild.channels.fetch(statusChannelId).catch(() => null);
    if (!channel || !channel.isTextBased() || typeof channel.send !== "function") return;
    const response = await fetch(publicStatusUrl);
    if (!response.ok) throw new Error(`O status público respondeu HTTP ${response.status}`);
    const body = await response.json();
    const status = body?.result?.data?.json ?? body?.result?.data ?? body?.data;
    const minecraft = status?.minecraft ?? {
      status: status?.minecraftStatus,
      onlinePlayers: status?.minecraftPlayersOnline,
      maxPlayers: status?.minecraftPlayersMax,
    };
    if (!minecraft.status) return;
    const online = minecraft.status === "ONLINE";
    const message = `${online ? "🟢" : "🔴"} **Servidor Minecraft: ${online ? "ONLINE" : "OFFLINE"}**\\n👥 Jogadores: **${Number(minecraft.onlinePlayers ?? 0)}/${Number(minecraft.maxPlayers ?? 0)}**\\n🌐 PlayCraftBR — status atualizado automaticamente pela PlayStorCraft.`;
    if (message === lastMinecraftMessage) return;
    await channel.send({ content: message });
    lastMinecraftMessage = message;
    console.info(`[Discord bot] Status do Paper publicado no canal ${statusChannelId}.`);
  }

  function operationMessage(notification) {
    const payload = notification.payload || {};
    if (notification.eventType === "PAYMENT_APPROVED") return `💳 **Pagamento aprovado**\nPedido: **${payload.orderNumber || "—"}**\nValor: **R$ ${((Number(payload.totalCents) || 0) / 100).toFixed(2).replace(".", ",")}**\nA entrega foi colocada na fila.`;
    if (notification.eventType === "DELIVERY_COMPLETED") return `📦 **Entrega concluída**\nPedido: **${payload.orderNumber || "—"}**\nJogador: **${payload.playerName || "—"}**\nProduto: **${payload.productName || "—"}**`;
    return `⚠️ **Entrega precisa de atenção**\nPedido: **${payload.orderNumber || "—"}**\nJogador: **${payload.playerName || "—"}**\nProduto: **${payload.productName || "—"}**\nMotivo: ${payload.error || "não informado"}`;
  }

  async function publishOperationsNotifications(guild) {
    if (!operationsChannelId) return;
    const channel = await guild.channels.fetch(operationsChannelId).catch(() => null);
    if (!channel || !channel.isTextBased() || typeof channel.send !== "function") return;
    const response = await fetch(`${operationsBridgeUrl}?limit=10`, { headers: { "x-playstor-discord-secret": bridgeSecret } });
    if (!response.ok) throw new Error(`A fila de operações respondeu HTTP ${response.status}`);
    const { notifications = [] } = await response.json();
    const sentIds = [];
    for (const notification of notifications) {
      await channel.send({ content: operationMessage(notification) });
      sentIds.push(notification.id);
    }
    if (!sentIds.length) return;
    const acknowledgment = await fetch(`${operationsBridgeUrl}/ack`, { method: "POST", headers: { "content-type": "application/json", "x-playstor-discord-secret": bridgeSecret }, body: JSON.stringify({ ids: sentIds }) });
    if (!acknowledgment.ok) throw new Error(`A confirmação de operações respondeu HTTP ${acknowledgment.status}`);
    console.info(`[Discord bot] ${sentIds.length} notificação(ões) operacional(is) publicada(s).`);
  }

  async function publishStatus() {
    const guild = guildId
      ? await client.guilds.fetch(guildId).catch(() => null)
      : client.guilds.cache.first() ?? null;
    if (!guild) {
      console.warn("[Discord bot] O servidor configurado não está disponível para este bot.");
      return;
    }
    const iconUrl = guild.iconURL({ extension: "png", size: 256 }) || undefined;
    const currentInviteUrl = await resolveInviteUrl(guild);
    const inviteCounts = !presenceEnabled ? await getInviteCounts(currentInviteUrl) : {};
    const onlineCount = presenceEnabled ? guild.presences.cache.filter(presence => presence.status !== "offline").size : inviteCounts.onlineCount;
    const payload = {
      discord: {
        guildId: guild.id,
        name: guild.name,
        iconUrl,
        inviteUrl: currentInviteUrl,
        memberCount: inviteCounts.memberCount ?? guild.memberCount,
        onlineCount,
        online: true,
      },
      sourceUpdatedAt: new Date().toISOString(),
    };
    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-playstor-discord-secret": bridgeSecret },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`A ponte respondeu HTTP ${response.status}`);
    await publishMinecraftStatus(guild);
    await publishOperationsNotifications(guild);
    console.info(`[Discord bot] Status publicado: ${guild.name} (${inviteCounts.memberCount ?? guild.memberCount} membros, ${onlineCount ?? "—"} online).`);
  }

  async function safelyPublish() {
    if (publishing || Date.now() - lastPublishedAt < 30_000) return;
    publishing = true;
    try {
      await publishStatus();
      lastPublishedAt = Date.now();
    } catch (error) {
      console.error("[Discord bot] Não foi possível publicar o status.", error instanceof Error ? error.message : error);
    } finally {
      publishing = false;
    }
  }

  client.once("ready", async () => {
    console.info(`[Discord bot] Conectado como ${client.user?.tag ?? "bot"}.`);
    await safelyPublish();
    publishTimer = setInterval(safelyPublish, publishIntervalMs);
  });
  client.on("guildMemberAdd", safelyPublish);
  client.on("guildMemberRemove", safelyPublish);
  if (presenceEnabled) client.on("presenceUpdate", safelyPublish);
  client.on("error", error => console.error("[Discord bot] Erro do cliente.", error.message));
  process.on("SIGTERM", async () => { if (publishTimer) clearInterval(publishTimer); client.destroy(); process.exit(0); });
  client.login(token).catch(error => { console.error("[Discord bot] Falha ao autenticar. Verifique o token e os intents habilitados no Discord.", error instanceof Error ? error.message : error); process.exit(1); });
}
