# Monitoramento PlayStorCraft

O monitoramento da PlayStorCraft possui duas camadas complementares. Um agente leve executado na VPS verifica a página pública, a API do catálogo e o snapshot integrado do Discord e do servidor Paper a cada cinco minutos. A aplicação grava os checks, calcula o estado atual e abre ou resolve incidentes. O painel administrativo em **/admin/monitoring** apresenta o estado, latência, falhas consecutivas, incidentes abertos e histórico recente.

> O monitoramento é somente leitura. Ele não cria pedidos, não processa pagamentos, não altera cupons e não libera entregas.

## Serviços observados

| Serviço | Verificação | Estados |
|---|---|---|
| Loja pública | `GET /` dentro da rede Docker | `ONLINE` ou `OFFLINE` conforme HTTP 200. |
| API da loja | Snapshot público `community.status` | `ONLINE` ou `OFFLINE` conforme resposta HTTP. |
| Bot Discord | Campo `discordOnline` do snapshot | `ONLINE` quando o bot publica presença; caso contrário `DEGRADED`. |
| Servidor Paper | Campo `minecraftStatus` do snapshot | `ONLINE` quando o Paper reporta online; caso contrário `DEGRADED`. |

Cada check guarda horário, estado, latência e uma mensagem curta. A aplicação mantém somente os checks dos últimos 30 dias. Incidentes são deduplicados enquanto permanecem abertos: a primeira falha gera um alerta no canal operacional, verificações seguintes atualizam o estado sem repetir a mensagem, e a recuperação gera um aviso de retorno.

## Implantação na VPS

O serviço `monitoring-agent` é definido em `deployment/vps/docker-compose.yml`. Ele usa a imagem leve `curlimages/curl`, o mesmo `MAINTENANCE_SECRET` já utilizado pelo scheduler de manutenção e o intervalo configurável `MONITOR_INTERVAL_SECONDS`, cujo padrão é 300 segundos.

```bash
cd /opt/playstorcraft
docker compose --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml \
  up -d --build --force-recreate app monitoring-agent discord-bot
```

Confira o estado e os logs:

```bash
docker compose --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml ps monitoring-agent

docker compose --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml logs --tail=100 monitoring-agent
```

O monitor não precisa de uma porta pública. Ele acessa `http://app:3000` pela rede interna Docker e envia os resultados para `/api/internal/monitoring` com o cabeçalho `x-maintenance-secret`. Não exponha essa rota no Nginx nem remova a autenticação do endpoint.

## Operação pelo painel

Administradores acessam **Administração → Monitoramento**. Os cartões mostram a quantidade de serviços online, serviços em atenção e incidentes abertos. Cada serviço apresenta seu estado atual, última verificação, latência, mensagem e número de falhas consecutivas. O histórico é atualizado automaticamente a cada 30 segundos no navegador. A seção **Disponibilidade por período** permite alternar entre 7 e 30 dias e calcula, por serviço, a média dos percentuais diários observados. Os gráficos exibem somente dias que possuem checks persistidos; períodos ainda sem dados aparecem claramente como `Ainda não há checks reais neste período`.

Se o painel mostrar `Aguardando`, aguarde o primeiro ciclo de cinco minutos. Se mostrar `Offline` para a loja ou API, verifique primeiro `app`; se mostrar `Atenção` para Discord ou Paper, confirme se o bot publicou um snapshot recente e se o Paper está enviando telemetria.

## Diagnóstico seguro

```bash
# Estado dos serviços

docker compose --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml ps app monitoring-agent discord-bot

# Logs do app e do monitor

docker compose --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml logs --tail=150 app monitoring-agent
```

Não use `docker compose down -v`, pois isso pode remover volumes persistentes. Se o monitor estiver falhando, reinicie somente `monitoring-agent`; se a aplicação estiver sem resposta, confirme primeiro os logs do `app` e o estado do MySQL.

## Limitações conhecidas

A verificação do Discord e do Paper depende do snapshot publicado pelo bot. Portanto, uma falha de atualização pode aparecer como `DEGRADED` mesmo quando o processo ainda está vivo. Esse comportamento é intencional: o painel sinaliza a ausência de confirmação recente sem afirmar que o processo foi encerrado.
