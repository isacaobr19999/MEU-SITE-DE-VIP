# Diagnóstico da confirmação Discord–Minecraft — 25/08/2026

O vínculo de `_Nube` foi confirmado no Discord e existe no banco da VPS em `player_discord_links`, com `linkedAt=2026-08-25 15:15:32`; o código correspondente também possui `usedAt` no mesmo horário e `target=DISCORD`. Portanto, o resgate Discord/API funciona.

Na VPS, o Paper está no container Pterodactyl `39ac6931-962c-49fc-b753-f4b9c74be67b`. O JAR `PlayStorCraft-Site.jar` declara `MinecraftDiscordPlatform` v0.1.0 e registra `/discord <link|unlink>`. O bytecode de `DiscordCommand` mostra geração do código e envio de mensagens como “Código de vinculação”, mas não mostra callback assíncrono após o resgate no Discord.

O `BackendClient` do mesmo JAR possui `getPendingCommands(serverKey)` e `reportCommandResult`, e o plugin faz polling administrativo. O backend atual ainda não possui módulo/rota de comandos pendentes, portanto esse mecanismo não entrega automaticamente uma confirmação de vínculo ao jogador.

O `DiscordBoosterLink-Paper-3.0.3.jar` é outro plugin, com comando `/booster`; a configuração central está desativada. O comando usado pelo jogador (`/discord link`) pertence ao JAR `PlayStorCraft-Site.jar`.

O RCON foi habilitado com senha aleatória armazenada somente na VPS com modo 600. A porta 25575 não é publicada pelo Docker nem liberada externamente; o acesso foi validado exclusivamente por túnel SSH. Os comandos de leitura `list`, `plugins`, `version`, `help discord` e `version DiscordBoosterLink` foram executados sem criar pedidos, pagamentos ou entregas.

Causa provável: o contrato legacy persiste o vínculo, mas o JAR ativo não possui polling de estado de vínculo para enviar uma mensagem ao jogador; o polling existente é de comandos administrativos e não está coberto por uma rota correspondente no backend atual. O próximo passo seguro é decidir entre adicionar uma fila/rota compatível e um tipo de mensagem suportado pelo JAR, ou obter o código-fonte do plugin para implementar um callback nativo. Não substituir o JAR ativo sem homologação.

## Correção aplicada

Foi criada a fila baseada em `integration_events`. O resgate Discord agora enfileira uma confirmação idempotente com tipo `minecraft.link.confirmed`. As rotas autenticadas `GET /api/integration/admin/commands/pending?serverKey=...` e `POST /api/integration/admin/commands/result` são compatíveis com o `BackendClient` do JAR legacy. O plugin recebe o evento como tipo `chat.discord`, que o JAR transforma em comando Paper `say [Discord] ...` e confirma a execução ao backend.

A correção foi testada com 49 arquivos e 135 testes Vitest, além de TypeScript sem erros. Para validar na VPS, é necessário publicar a aplicação e realizar um novo vínculo; o vínculo já existente de `_Nube` foi preservado e não foi duplicado nem removido.
