# API do plugin Minecraft

Todos os endpoints abaixo exigem `X-PlayStor-Server-Key`. A chave é única por servidor, validada por hash no backend e nunca deve ser transmitida a jogadores ou armazenada em repositórios.

| Endpoint | Corpo | Resultado |
| --- | --- | --- |
| `POST /api/minecraft/deliveries/claim` | `{ "limit": 10 }` | Obtém até o limite de entregas pendentes daquele servidor com token de claim. |
| `POST /api/minecraft/deliveries/complete` | `deliveryId`, `claimToken` | Marca uma entrega executada uma única vez. |
| `POST /api/minecraft/deliveries/fail` | `deliveryId`, `claimToken`, `error` | Registra falha e aplica retry com backoff. |
| `POST /api/minecraft/deliveries/defer` | `deliveryId`, `claimToken` | Devolve entrega de jogador offline para a fila sem aumentar tentativas. |

Um claim expira em cinco minutos. O plugin nunca deve executar uma entrega sem claim válido, e deve enviar apenas a confirmação correspondente ao `deliveryId` e `claimToken` recebidos. Placeholders são interpolados no backend antes de a resposta ser devolvida ao Paper.
