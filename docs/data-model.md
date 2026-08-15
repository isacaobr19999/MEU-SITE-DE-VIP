# Modelo de Dados e Contratos Transacionais

## Estados permitidos

| Entidade | Estados |
| --- | --- |
| Pedido | `PENDING`, `WAITING_PAYMENT`, `PAID`, `PROCESSING`, `COMPLETED`, `CANCELLED`, `REFUNDED`, `FAILED` |
| Pagamento | `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`, `FAILED` |
| Entrega | `PENDING`, `CLAIMED`, `PROCESSING`, `COMPLETED`, `RETRYING`, `FAILED`, `CANCELLED` |

O pedido é a entidade comercial central. O pagamento é registrado separadamente para preservar o histórico do gateway e suas notificações. Uma entrega representa uma ação concreta de aplicação de comandos em um servidor, vinculada ao item de pedido e ao jogador destinatário.

## Invariantes

> O preço, os comandos, o grupo LuckPerms e a duração são copiados para o item de pedido no momento da compra. Alterar um produto posteriormente não muda uma compra já registrada.

| Regra | Mecanismo |
| --- | --- |
| Um checkout não cria dois pedidos | `orders.idempotencyKey` possui unicidade. |
| Uma notificação não aprova duas vezes | O evento externo e a operação de pagamento possuem chaves únicas por provedor. |
| Uma entrega não executa duas vezes | Cada entrega tem chave de idempotência e lock temporário de reivindicação. |
| Chaves de servidores não são recuperáveis | Apenas `apiKeyHash` e os últimos quatro caracteres são persistidos. |
| Cupons respeitam limites | Uso por pedido é único e a validação considera período, escopo, quantidade global e limite por jogador. |
| Alterações administrativas são rastreáveis | O log registra ator, ação, entidade, dados auxiliares e instante. |

## Placeholders de entrega

Os templates de comando aceitam exclusivamente `{player}`, `{uuid}`, `{product}`, `{server}` e `{duration}`. A substituição é realizada no plugin após a entrega ser reivindicada, usando o snapshot do item de pedido e o perfil do jogador, e nunca com conteúdo enviado diretamente pelo navegador.
