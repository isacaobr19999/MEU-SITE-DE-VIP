# Progresso de permissões do Discord

Data: 17/08/2026

- O canal `💬-chat-geral` (ID `1492896718969110670`) foi aberto no painel de permissões, o modo **Canal privado** foi desativado e a alteração foi salva.
- A lista lateral confirmou `💬-chat-geral` sem a indicação `Canal Privado (bloqueado)`.
- A categoria `🌍 COMUNIDADE` ainda contém canais limitados: `📸-prints-e-clipes`, `🧱-mostra-sua-base`, `💡-sugestões`, `🗳️-enquetes` e `🐛・reportar-bug`.
- IDs confirmados no HTML do Discord: `1492896761801605321`, `1492896832903184548`, `1492896935298994186`, `1492896985454481598`, `1538821524813774878`.
- A política planejada é tornar esses canais comunitários públicos para membros verificados, mantendo áreas de staff, tickets e whitelist privadas.
- O painel de permissões mostrou que canais podem ficar dessincronizados da categoria após a abertura; isso é esperado e deve ser preservado apenas nesses canais comunitários públicos.

## Ticket Tool

- URL acessada: `https://tickettool.xyz/dashboard`.
- A autorização OAuth do Discord foi aprovada pelo titular da conta `isacaobr`; o aplicativo declarou que acessa identidade, e-mail e lista de servidores, sem ler ou enviar mensagens.
- Callback retornou: `https://api.tickettool.xyz/api/auth/callback?...`.
- Resultado exibido pelo serviço: `Login process is successful. But something went wrong. Please return to the login page and try again.`
- A configuração do Ticket Tool não avançou porque o painel externo não concluiu a sessão após o OAuth. Não foram concedidas permissões adicionais ao bot nem feitas alterações destrutivas.
