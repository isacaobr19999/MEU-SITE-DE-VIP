# Eficiência e operação

## Estado atual

A aplicação web deve ser diferenciada do servidor Minecraft. O site pode estar saudável enquanto o Paper estiver offline, e a loja pode estar em manutenção mesmo quando nginx, Express e os assets respondem normalmente.

## Melhorias implementadas

A barreira global de manutenção agora preserva as rotas públicas informativas `/rules`, `/news`, `/status` e `/maintenance-history`. O checkout continua protegido quando a loja está fechada.

O monitor da VPS passou a medir latência em milissegundos e a classificar o Minecraft sem confirmação de presença como `OFFLINE`, em vez de `DEGRADED`. Isso reduz ambiguidade no painel operacional.

Foi criado o workflow `.github/workflows/plugin-release.yml`. Tags `v*` executam o build Java 21, validam o `plugin.yml`, geram `SHA256SUMS` e anexam o JAR ao release do GitHub.

## Checklist de produção

Depois de cada deploy, execute `docker compose ps`, `docker compose logs --tail=100 app`, `nginx -t` e `deployment/vps/verify-playstorcraft.sh`. Confirme HTTP 200 na página inicial, resposta 200 da API `community.status`, carregamento dos assets, estado do Discord, estado do Minecraft e fila de entregas.

A manutenção deve sempre ser agendada com horário de início e término. Ao terminar, confirme no painel administrativo que `publicOnline` voltou a `true` e que `scheduleStatus` está `COMPLETED`. Não reabra pagamentos sem validar a fila e os pedidos protegidos.

## Pendências que exigem a VPS

A publicação do código no GitHub não altera a aplicação já executada na VPS. É necessário fazer o deploy do commit correspondente, reiniciar somente os serviços necessários e verificar os logs. A situação do Paper também exige acesso ao servidor Minecraft ou ao painel de hospedagem para iniciar o processo e confirmar a conexão do plugin.

Backups devem ser copiados para uma localização externa e a restauração deve ser testada periodicamente. Nunca versionar `.env`, `config.yml` preenchido, chaves de servidor, tokens, dumps ou dados pessoais.
