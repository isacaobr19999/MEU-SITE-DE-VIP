# Integração de Pagamentos — Mercado Pago Checkout Pro

## Escopo adotado

A PlayStorCraft usará o **Mercado Pago Checkout Pro** como gateway configurável. O servidor cria uma preferência para o pedido e envia o cliente para o ambiente hospedado do gateway, onde PIX e cartão são apresentados conforme a disponibilidade da conta. O frontend não confirma pagamentos e não recebe credenciais privadas.

## Contrato do webhook

O endpoint de produção será `POST /api/webhooks/mercadopago`. Ele receberá apenas notificações do tópico `payment`, validará a assinatura `x-signature` juntamente com `x-request-id` e o identificador `data.id`, e buscará o pagamento completo na API do Mercado Pago antes de atualizar o pedido.

| Controle | Implementação |
| --- | --- |
| Autenticidade | Validação HMAC com a assinatura secreta do webhook, mantida em variável de ambiente. |
| Integridade do pedido | O `externalReference` da preferência corresponde ao UUID interno do pedido. |
| Idempotência | `providerPaymentId` tem índice único, enquanto `providerEventId` evita reprocessar a mesma notificação. |
| Transição de estado | Somente o webhook pode marcar um pedido como `PAID` e criar entregas. |
| Resposta | O endpoint devolve 200 após processar com segurança; falhas transitórias retornam erro para permitir nova tentativa pelo gateway. |

## Configuração requerida

Configure no painel do Mercado Pago o evento **Pagamentos**, em uma URL HTTPS de domínio público, e copie a assinatura secreta para `MERCADO_PAGO_WEBHOOK_SECRET`. A preferência inclui a mesma URL por `notification_url` para preservar a associação por pedido.

## Referências

[1] [Mercado Pago — Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/overview)

[2] [Mercado Pago — Configurar notificações de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)

[3] [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
