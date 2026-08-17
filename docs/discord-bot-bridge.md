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

## Ativação quando o acesso ao Discord estiver disponível

Enquanto o acesso ao Portal do Desenvolvedor do Discord não estiver disponível, a loja continua operando normalmente e a comunidade pode publicar regras, novidades e o link de convite pelo painel administrativo em `/admin/community`.

Quando a conta Discord puder ser acessada novamente, o processo do bot deve receber o token somente pelo runtime da VPS e manter a chave `DISCORD_BOT_BRIDGE_SECRET` somente no runtime. O bot deve usar a conexão em tempo real do Discord para calcular os totais da comunidade e enviar o resumo à ponte privada. O convite salvo pelo painel não é apagado caso o bot envie uma atualização parcial sem esse campo.

O serviço `discord-bot` já acompanha a implantação da VPS e permanece em espera sem abrir conexão enquanto faltarem as variáveis abaixo. Quando o acesso for recuperado, basta registrar os valores no runtime privado e reiniciar apenas esse serviço.

| Variável | Finalidade |
|---|---|
| `DISCORD_BOT_TOKEN` | Token privado do bot, gerado no Portal do Desenvolvedor do Discord. |
| `DISCORD_GUILD_ID` | Identificador numérico do servidor Discord da PlayStorCraft. |
| `DISCORD_BOT_BRIDGE_SECRET` | Chave compartilhada exclusivamente entre o bot e a ponte privada da loja. |
| `DISCORD_ENABLE_PRESENCE` | Mantém a contagem de membros online; requer habilitar o intent de presenças no portal do Discord. |
