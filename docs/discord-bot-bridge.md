# Ponte PlayStorCraft: Discord, bot e Paper

## Visão geral

O site expõe uma rota privada para receber o resumo já calculado pelo bot. O token do Discord permanece somente no processo do bot; o site recebe apenas informações públicas para exibição.

| Item | Valor |
|---|---|
| Rota | `POST https://playstorcraft.com.br/api/integrations/discord/status` |
| Autorização | Cabeçalho `x-playstor-discord-secret` com o valor de `DISCORD_BOT_BRIDGE_SECRET` |
| Frequência sugerida | Quando houver alteração relevante ou a cada 60–120 segundos pelo bot |
| Dados aceitos | Comunidade Discord, convite, membros, presença e status/resumo do Paper |

## Exemplo de atualização

```json
{
  "discord": {
    "guildId": "123456789012345678",
    "name": "Comunidade PlayStorCraft",
    "iconUrl": "https://cdn.discordapp.com/icons/...",
    "inviteUrl": "https://discord.gg/seu-convite",
    "memberCount": 120,
    "onlineCount": 24,
    "online": true
  },
  "minecraft": {
    "status": "ONLINE",
    "playersOnline": 8,
    "playersMax": 100,
    "motd": "PlayStorCraft",
    "version": "Paper 1.21.x"
  },
  "sourceUpdatedAt": "2026-08-16T12:00:00.000Z"
}
```

## Segurança

Não envie o token do bot Discord para o site. Configure no processo do bot a mesma variável `DISCORD_BOT_BRIDGE_SECRET` registrada no runtime da PlayStorCraft. A rota rejeita atualizações sem o cabeçalho correto e a interface pública expõe apenas dados próprios para a comunidade.
