import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();
const bridgeSecret = process.env.DISCORD_BOT_BRIDGE_SECRET?.trim();
const bridgeUrl = process.env.PLAYSTORCRAFT_BRIDGE_URL?.trim() || "http://app:3000/api/integrations/discord/status";
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

  async function publishStatus() {
    const guild = guildId
      ? await client.guilds.fetch(guildId).catch(() => null)
      : client.guilds.cache.first() ?? null;
    if (!guild) {
      console.warn("[Discord bot] O servidor configurado não está disponível para este bot.");
      return;
    }
    const iconUrl = guild.iconURL({ extension: "png", size: 256 }) || undefined;
    const onlineCount = presenceEnabled ? guild.presences.cache.filter(presence => presence.status !== "offline").size : undefined;
    const payload = {
      discord: {
        guildId: guild.id,
        name: guild.name,
        iconUrl,
        memberCount: guild.memberCount,
        onlineCount,
        online: true,
      },
      minecraft: { status: "UNKNOWN" },
      sourceUpdatedAt: new Date().toISOString(),
    };
    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-playstor-discord-secret": bridgeSecret },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`A ponte respondeu HTTP ${response.status}`);
    console.info(`[Discord bot] Status publicado: ${guild.name} (${guild.memberCount} membros).`);
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
  client.on("presenceUpdate", safelyPublish);
  client.on("error", error => console.error("[Discord bot] Erro do cliente.", error.message));
  process.on("SIGTERM", async () => { if (publishTimer) clearInterval(publishTimer); client.destroy(); process.exit(0); });
  client.login(token).catch(error => { console.error("[Discord bot] Falha ao autenticar. Verifique o token e os intents habilitados no Discord.", error instanceof Error ? error.message : error); process.exit(1); });
}
