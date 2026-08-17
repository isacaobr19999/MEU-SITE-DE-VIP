# Integração PlayStorCraft → DiscordBoosterLink

A integração usa a fila autenticada de entregas já existente na PlayStorCraft. O pagamento aprovado cria uma entrega pendente; o plugin PlayStorCraft instalado no Paper reivindica essa entrega, executa os comandos no console e confirma o `deliveryId` com o `claimToken`. Não é necessário criar um segundo webhook de pagamento.

## Pré-requisitos

O servidor Paper deve ter o plugin `PlayStorCraft` configurado com a URL pública da loja e a chave individual do servidor:

```yml
api-base-url: "https://playstorcraft.com.br"
server-api-key: "CHAVE_GERADA_NO_PAINEL_DA_LOJA"
poll-interval-seconds: 15
claim-limit: 10
```

A chave deve ser copiada apenas para o arquivo de configuração do servidor. Ela não deve ser enviada para jogadores nem adicionada ao GitHub.

O DiscordBoosterLink deve estar instalado no mesmo Paper e ter os níveis configurados no `config.yml`:

```yml
playmcmmo:
  enabled: true
```

Os níveis usados pelos produtos são `mcmmo_xp_15_7d`, `mcmmo_xp_2_15d` e `mcmmo_xp_3_30d`.

## Produtos no painel administrativo

Crie ou edite cada produto em **Administração → Catálogo**. O servidor de destino deve ser o mesmo servidor que possui o plugin PlayStorCraft e o DiscordBoosterLink. O comando deve ser inserido sem a barra inicial, uma linha por comando.

| Produto | Duração do produto | Comando de entrega | Minutos enviados ao booster |
|---|---:|---|---:|
| Booster 1,5× | 7 dias | `booster grant {player} mcmmo_xp_15_7d 10080` | 7 × 24 × 60 |
| Booster 2× | 15 dias | `booster grant {player} mcmmo_xp_2_15d 21600` | 15 × 24 × 60 |
| Booster 3× | 30 dias | `booster grant {player} mcmmo_xp_3_30d 43200` | 30 × 24 × 60 |

O placeholder `{player}` é substituído pelo nome do jogador antes da entrega. O plugin PlayStorCraft mantém o jogador offline na fila e tenta novamente quando ele estiver online. O comando `booster grant` é executado pelo console, portanto não depende da permissão do jogador.

> A duração do produto é armazenada em dias pela loja; o comando administrativo do DiscordBoosterLink recebe a duração em minutos. Por isso os valores de 10080, 21600 e 43200 são intencionais.

## Comportamento operacional

Se o pagamento for aprovado, a entrega aparece como `PENDING`. O plugin PlayStorCraft faz o claim com token temporário, executa o comando somente no Paper e envia confirmação apenas depois que o comando termina. Em caso de jogador offline, a entrega volta para a fila sem consumir uma tentativa. Em caso de erro, a loja aplica retry com backoff.

A operação é idempotente no lado da loja pelo `deliveryId` e na concessão do DiscordBoosterLink pela referência local da entrega. Não execute manualmente o mesmo comando fora da fila para corrigir um pedido sem antes verificar o estado da entrega no painel.

## Teste recomendado

Use um jogador de teste e um produto de baixo valor. Após o pagamento aprovado, confirme no painel que a entrega passa de `PENDING` para `CLAIMED` e depois `COMPLETED`. No jogo, confirme `/booster status` ou consulte o efeito do booster. Em seguida, reinicie o Paper e verifique que nenhuma nova concessão é executada para a mesma entrega.

## Referências

[1]: ../docs/minecraft-api.md "API autenticada de entregas da PlayStorCraft"
[2]: ../docs/minecraft-plugin.md "Plugin Paper PlayStorCraft"
