# Plugin Paper PlayStorCraft

O módulo em `minecraft-plugin/` é um plugin Paper independente. Ele consulta a API da loja em intervalo configurável, recebe somente entregas destinadas ao seu servidor e confirma cada uma com um token de reivindicação de uso único. Nenhuma chave de API é armazenada no banco de dados da loja em texto puro.

## Status de ativação

Há dois módulos distintos no projeto: `minecraft-plugin/` é o plugin de entregas `PlayStorCraft`, enquanto `minecraft-status-plugin/` é o plugin de telemetria `PlayStorCraftStatus`. Eles não devem ser confundidos com `PlayStorCraft-Site.jar`, que no servidor atual contém o plugin `MinecraftDiscordPlatform` v0.1.0. A substituição desse JAR exige uma decisão explícita, pois ele pode fornecer integrações de Discord e conta atualmente usadas pelo servidor.

## Instalação

Compile cada módulo com Java 21 e o Wrapper Gradle correspondente, copie o JAR gerado para `plugins/` e reinicie o Paper. Para o módulo de entregas, configure `plugins/PlayStorCraft/config.yml`. Para a telemetria, configure `plugins/PlayStorCraftStatus/config.yml` com a mesma URL HTTPS e a chave individual do servidor. Na VPS atual, a URL da telemetria foi corrigida para `https://playstorcraft.com.br` e a chave foi copiada localmente do plugin de entregas sem ser registrada no repositório; a aplicação da mudança depende do próximo reinício do Paper.

> Não configure comandos de prefixo, scoreboard ou tablist neste plugin. A PlayStorCraft trata exclusivamente de compras e entregas; assim, não conflita com TAB ou plugins de chat.

## LuckPerms

O plugin detecta LuckPerms como dependência opcional. Produtos com `luckPermsGroup` geram um marcador interno que a API oficial do LuckPerms transforma em um nó de herança de grupo. Para VIPs temporários, a manutenção agendada coloca um marcador de remoção na fila quando a concessão expira. O plugin mantém suporte a comandos de console comuns para kits, coins e cosméticos.

## Placeholders

Antes de enviar a entrega, a loja substitui `{player}`, `{uuid}`, `{product}`, `{server}` e `{duration}` nos comandos armazenados. A execução ocorre no console do Paper; a confirmação só é enviada depois que a execução é concluída.

Quando o UUID do jogador não estiver online no Paper, o plugin devolve a reivindicação à fila com um pequeno atraso e sem consumir uma tentativa. Assim, benefícios que dependem da presença do jogador não são executados antecipadamente nem marcados como falhos apenas por ele estar offline.

## Referências

[1] [LuckPerms — Developer API](https://luckperms.net/wiki/Developer-API)

[2] [LuckPerms API Javadocs](https://javadoc.io/doc/net.luckperms/api/latest/index.html)
