# Plugin Paper PlayStorCraft

O módulo em `minecraft-plugin/` é um plugin Paper independente. Ele consulta a API da loja em intervalo configurável, recebe somente entregas destinadas ao seu servidor e confirma cada uma com um token de reivindicação de uso único. Nenhuma chave de API é armazenada no banco de dados da loja em texto puro.

## Instalação

Compile o módulo com Java 21 e Gradle, copie o JAR gerado para `plugins/` em um servidor Paper 1.20.6 ou compatível e reinicie. Em `plugins/PlayStorCraft/config.yml`, defina a URL HTTPS da loja e a chave específica do servidor revelada no painel administrativo.

> Não configure comandos de prefixo, scoreboard ou tablist neste plugin. A PlayStorCraft trata exclusivamente de compras e entregas; assim, não conflita com TAB ou plugins de chat.

## LuckPerms

O plugin detecta LuckPerms como dependência opcional. Produtos com `luckPermsGroup` geram um marcador interno que a API oficial do LuckPerms transforma em um nó de herança de grupo. Para VIPs temporários, a manutenção agendada coloca um marcador de remoção na fila quando a concessão expira. O plugin mantém suporte a comandos de console comuns para kits, coins e cosméticos.

## Placeholders

Antes de enviar a entrega, a loja substitui `{player}`, `{uuid}`, `{product}`, `{server}` e `{duration}` nos comandos armazenados. A execução ocorre no console do Paper; a confirmação só é enviada depois que a execução é concluída.

Quando o UUID do jogador não estiver online no Paper, o plugin devolve a reivindicação à fila com um pequeno atraso e sem consumir uma tentativa. Assim, benefícios que dependem da presença do jogador não são executados antecipadamente nem marcados como falhos apenas por ele estar offline.

## Referências

[1] [LuckPerms — Developer API](https://luckperms.net/wiki/Developer-API)

[2] [LuckPerms API Javadocs](https://javadoc.io/doc/net.luckperms/api/latest/index.html)
