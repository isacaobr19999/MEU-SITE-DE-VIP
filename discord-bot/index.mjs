import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits, ModalBuilder, REST, Routes, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { copyCodeButton, linkCodeMessage, linkSuccessMessage } from "./linkMessages.mjs";

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const applicationId = process.env.DISCORD_APPLICATION_ID?.trim() || (token ? Buffer.from(token.split(".")[0], "base64url").toString("utf8") : undefined);
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
const bridgeSecret = process.env.DISCORD_BOT_BRIDGE_SECRET?.trim();
const integrationKey = process.env.INTEGRATION_API_KEY?.trim();
const backendUrl = process.env.PLAYSTORCRAFT_BACKEND_URL?.trim() || "http://app:3000";
const bridgeUrl = process.env.PLAYSTORCRAFT_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/status";
const inviteUrl = process.env.DISCORD_INVITE_URL?.trim();
const inviteChannelId = process.env.DISCORD_INVITE_CHANNEL_ID?.trim();
const statusChannelId = process.env.DISCORD_STATUS_CHANNEL_ID?.trim();
const operationsChannelId = process.env.DISCORD_OPERATIONS_CHANNEL_ID?.trim();
const ticketTranscriptsChannelId = process.env.DISCORD_TICKET_TRANSCRIPTS_CHANNEL_ID?.trim();
const publicStatusUrl = process.env.PLAYSTORCRAFT_PUBLIC_STATUS_URL?.trim();
const operationsBridgeUrl = process.env.PLAYSTORCRAFT_OPERATIONS_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/operations";
const ticketTranscriptsBridgeUrl = process.env.PLAYSTORCRAFT_TICKET_TRANSCRIPTS_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/ticket-transcripts";
const managedInviteEnabled = process.env.DISCORD_MANAGED_INVITE === "true";
const managedInvitePath = "/bot/data/community-invite.json";
const presenceEnabled = process.env.DISCORD_ENABLE_PRESENCE !== "false";
const publishIntervalMs = Math.max(60_000, Number(process.env.DISCORD_STATUS_INTERVAL_MS) || 90_000);

function keepDisabledServiceAlive() {
  console.warn("[Discord bot] Aguardando credenciais Discord e integração legacy no runtime. Nenhuma conexão com o Discord será aberta.");
  setInterval(() => console.info("[Discord bot] Serviço em espera por credenciais."), 6 * 60 * 60 * 1000);
}

if (!token || !bridgeSecret || !integrationKey) {
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
  const slashCommands = [
    new SlashCommandBuilder().setName("link").setDescription("Vincula sua conta Discord ao Minecraft.").toJSON(),
    new SlashCommandBuilder().setName("unlink").setDescription("Desvincula sua conta Discord do Minecraft.").toJSON(),
  ];

  async function registerLinkCommands() {
    if (!applicationId) return;
    const rest = new REST({ version: "10" }).setToken(token);
    const route = guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId);
    await rest.put(route, { body: slashCommands });
    console.info("[Discord bot] Comandos /link e /unlink registrados.");
  }

  function linkButton() {
    return new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("legacy-link:open").setLabel("Informar código").setStyle(ButtonStyle.Success));
  }

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
    if (notification.eventType === "LOGIN_SECURITY_ALERT") return `🔐 **Bloqueio preventivo de login administrativo**\nConta: **${payload.emailHint || "não informada"}**\nTentativas recentes: **${Number(payload.failedAttempts) || 5}**${payload.lockedUntil ? `\nBloqueio temporário até: <t:${Math.floor(new Date(payload.lockedUntil).getTime() / 1000)}:f>.` : ""}\nNenhuma senha, token ou IP foi registrado neste alerta.`;
    if (notification.eventType === "MONITORING_ALERT") return payload.status === "RESOLVED" ? `✅ **Serviço recuperado**\nServiço: **${payload.label || payload.serviceKey || "não informado"}**\nO monitor confirmou a recuperação.` : `🚨 **Alerta de monitoramento**\nServiço: **${payload.label || payload.serviceKey || "não informado"}**\nEstado: **${payload.status || "OFFLINE"}**\nMotivo: ${payload.message || "sem resposta"}`;
    if (notification.eventType === "STORE_MAINTENANCE_TEST") return `🧪 **Teste de aviso de manutenção**\nEste é um teste controlado do canal configurado. A loja continua **online** e nenhuma compra ou pagamento foi interrompido.`;
    if (notification.eventType === "STORE_MAINTENANCE_STARTED") {
      if (payload.template === "CONCISE") return `🛠️ **Loja em manutenção**\nCompras e pagamentos foram pausados temporariamente. Pedidos já confirmados permanecem protegidos.${payload.scheduledEndAt ? `\nPrevisão de retorno: <t:${Math.floor(new Date(payload.scheduledEndAt).getTime() / 1000)}:f>.` : ""}`;
      if (payload.template === "COMMUNITY") return `🛠️ **Pausa para melhorias**\nEstamos cuidando da loja para manter tudo funcionando bem. Os pedidos já confirmados seguem protegidos.${payload.scheduledEndAt ? `\nEsperamos voltar até <t:${Math.floor(new Date(payload.scheduledEndAt).getTime() / 1000)}:f>.` : ""}`;
      return `🛠️ **Loja em manutenção**\nModo: **${payload.mode === "CATALOG_ONLY" ? "somente catálogo" : "loja temporariamente fechada"}**\n${payload.reason ? `Motivo: ${payload.reason}\n` : ""}A comunidade foi avisada e os pedidos já confirmados continuam protegidos.${payload.scheduledEndAt ? `\nPrevisão de retorno: <t:${Math.floor(new Date(payload.scheduledEndAt).getTime() / 1000)}:f>.` : ""}`;
    }
    if (notification.eventType === "STORE_MAINTENANCE_ENDED") return payload.template === "COMMUNITY" ? `✅ **Voltamos!**\nA manutenção foi concluída e a loja já está disponível novamente. Obrigado pela paciência.` : `✅ **Loja reaberta**\nA manutenção foi concluída e compras e pagamentos voltaram a ficar disponíveis.${payload.reason ? `\nMotivo registrado: ${payload.reason}` : ""}`;
    return `⚠️ **Entrega precisa de atenção**\nPedido: **${payload.orderNumber || "—"}**\nJogador: **${payload.playerName || "—"}**\nProduto: **${payload.productName || "—"}**\nMotivo: ${payload.error || "não informado"}`;
  }

  async function publishOperationsNotifications(guild) {
    const channel = operationsChannelId ? await guild.channels.fetch(operationsChannelId).catch(() => null) : null;
    if (operationsChannelId && (!channel || !channel.isTextBased() || typeof channel.send !== "function")) return;
    const response = await fetch(`${operationsBridgeUrl}?limit=10`, { headers: { "x-playstor-discord-secret": bridgeSecret } });
    if (!response.ok) throw new Error(`A fila de operações respondeu HTTP ${response.status}`);
    const { notifications = [] } = await response.json();
    const sentIds = [];
    for (const notification of notifications) {
      const requestedChannelId = ["STORE_MAINTENANCE_STARTED", "STORE_MAINTENANCE_ENDED"].includes(notification.eventType) && /^\d{17,20}$/.test(String(notification.payload?.channelId || "")) ? String(notification.payload.channelId) : operationsChannelId;
      const requestedChannel = requestedChannelId === operationsChannelId ? channel : await guild.channels.fetch(requestedChannelId).catch(() => null);
      const targetChannel = requestedChannel && requestedChannel.guildId === guild.id && requestedChannel.isTextBased() && typeof requestedChannel.send === "function" ? requestedChannel : channel;
      if (!targetChannel || !targetChannel.isTextBased() || typeof targetChannel.send !== "function") {
        console.warn(`[Discord bot] Nenhum canal válido para a notificação ${notification.id}. Configure DISCORD_OPERATIONS_CHANNEL_ID ou o canal de manutenção.`);
        continue;
      }
      await targetChannel.send({ content: operationMessage(notification) });
      sentIds.push(notification.id);
    }
    if (!sentIds.length) return;
    const acknowledgment = await fetch(`${operationsBridgeUrl}/ack`, { method: "POST", headers: { "content-type": "application/json", "x-playstor-discord-secret": bridgeSecret }, body: JSON.stringify({ ids: sentIds }) });
    if (!acknowledgment.ok) throw new Error(`A confirmação de operações respondeu HTTP ${acknowledgment.status}`);
    console.info(`[Discord bot] ${sentIds.length} notificação(ões) operacional(is) publicada(s).`);
  }

  function isTicketTranscriptMessage(message) {
    if (!message.author?.bot || message.author.id === client.user?.id) return false;
    const attachments = [...message.attachments.values()];
    const embeds = message.embeds ?? [];
    const hasTranscriptAttachment = attachments.some(attachment => /transcript|ticket/i.test(attachment.name ?? ""));
    const hasTranscriptLink = embeds.some(embed => /tickettool\.xyz\/transcript/i.test(embed.url ?? "") || /transcript/i.test(embed.title ?? ""));
    return hasTranscriptAttachment || hasTranscriptLink;
  }

  async function syncTicketTranscriptMetadata(guild) {
    if (!ticketTranscriptsChannelId) return;
    const channel = await guild.channels.fetch(ticketTranscriptsChannelId).catch(() => null);
    if (!channel || !channel.isTextBased() || typeof channel.messages?.fetch !== "function") return;
    const messages = await channel.messages.fetch({ limit: 25 });
    const transcripts = [...messages.values()].filter(isTicketTranscriptMessage).map(message => ({ messageId: message.id, closedAt: message.createdAt.toISOString() }));
    if (!transcripts.length) return;
    const response = await fetch(ticketTranscriptsBridgeUrl, { method: "POST", headers: { "content-type": "application/json", "x-playstor-discord-secret": bridgeSecret }, body: JSON.stringify({ transcripts }) });
    if (!response.ok) throw new Error(`A sincronização de transcrições respondeu HTTP ${response.status}`);
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
    await syncTicketTranscriptMetadata(guild);
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

  client.on("interactionCreate", async interaction => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === "link") {
        await interaction.reply({ content: "Use `/discord link` no Minecraft para gerar seu código de 6 dígitos e depois informe-o aqui.", components: [linkButton()], ephemeral: true });
        return;
      }
      if (interaction.isChatInputCommand() && interaction.commandName === "unlink") {
        const result = await fetch(`${backendUrl}/api/integration/unlink-discord`, { method: "POST", headers: { "content-type": "application/json", "x-integration-key": integrationKey }, body: JSON.stringify({ discordUserId: interaction.user.id }) }).then(async response => ({ ok: response.ok, body: await response.json().catch(() => ({})) }));
        if (!result.ok) throw new Error(result.body.error ?? "UNLINK_FAILED");
        await interaction.reply({ content: result.body.unlinked ? "Sua conta Minecraft foi desvinculada." : "Nenhum vínculo ativo foi encontrado.", ephemeral: true });
        return;
      }
      if (interaction.isButton() && interaction.customId.startsWith("legacy-link:copy:")) {
        const code = interaction.customId.slice("legacy-link:copy:".length);
        if (!/^\d{6}$/.test(code)) throw new Error("Código inválido.");
        await interaction.reply({ content: `📋 Código pronto para copiar:\n\`${code}\``, ephemeral: true });
        return;
      }
      if (interaction.isButton() && interaction.customId === "legacy-link:open") {
        const modal = new ModalBuilder().setCustomId("legacy-link:submit").setTitle("Vincular Minecraft");
        const code = new TextInputBuilder().setCustomId("code").setLabel("Código de 6 dígitos").setPlaceholder("000000").setMinLength(6).setMaxLength(6).setRequired(true).setStyle(TextInputStyle.Short);
        modal.addComponents(new ActionRowBuilder().addComponents(code));
        await interaction.showModal(modal);
        return;
      }
      if (interaction.isModalSubmit() && interaction.customId === "legacy-link:submit") {
        const code = interaction.fields.getTextInputValue("code");
        const response = await fetch(`${backendUrl}/api/integration/link-codes/redeem-discord`, { method: "POST", headers: { "content-type": "application/json", "x-integration-key": integrationKey }, body: JSON.stringify({ code, discordUserId: interaction.user.id, username: interaction.user.username, globalName: interaction.user.globalName }) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? "LINK_FAILED");
        await interaction.reply({ content: linkSuccessMessage(body.username), components: [copyCodeButton(code)], ephemeral: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) await interaction.followUp({ content: `Não foi possível concluir: ${message}`, ephemeral: true }).catch(() => {});
        else await interaction.reply({ content: `Não foi possível concluir: ${message}`, ephemeral: true }).catch(() => {});
      }
    }
  });

  client.once("ready", async () => {
    console.info(`[Discord bot] Conectado como ${client.user?.tag ?? "bot"}.`);
    await registerLinkCommands().catch(error => console.error("[Discord bot] Falha ao registrar comandos de vínculo.", error instanceof Error ? error.message : error));
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
