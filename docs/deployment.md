# Operação e implantação da PlayStorCraft

## Configuração segura

As credenciais devem ser cadastradas no painel de segredos do projeto, nunca incluídas em arquivos versionados, no frontend ou na configuração do plugin. A tabela abaixo descreve os valores que precisam ser informados antes de ativar pagamentos e servidores Minecraft.

| Variável | Finalidade | Obrigatória para |
| --- | --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Cria preferências e consulta o pagamento confirmado pelo gateway. | PIX e cartão |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Valida `x-signature` e `x-request-id` nas notificações do gateway. | Webhooks |
| `APP_BASE_URL` | Domínio HTTPS público da loja, sem barra final. | Retornos e webhooks |
| `MINECRAFT_API_KEY_PEPPER` | Protege hashes das chaves individuais dos servidores Minecraft. | Entregas automáticas |

> A confirmação de uma compra é recebida exclusivamente no endpoint do servidor. Redirecionamentos de checkout e páginas de sucesso servem apenas para a experiência do cliente e não liberam produtos.

## Publicação

Crie um checkpoint da versão aprovada e use o botão **Publicar** da interface do projeto. Depois de publicado, associe um domínio próprio HTTPS nas configurações do projeto e defina esse mesmo domínio em `APP_BASE_URL`. A URL do webhook deve ser `https://SEU-DOMINIO/api/webhooks/mercadopago`.

No painel do Mercado Pago, habilite o tópico **Pagamentos** e informe a URL HTTPS de webhook. A documentação do gateway exige validação por assinatura secreta e recomenda buscar o recurso de pagamento pela API antes de atualizar o estado interno, abordagem já usada nesta plataforma. [1] [2]

## Ativação da manutenção

Após a publicação, crie uma tarefa de manutenção do projeto com a expressão UTC `0 0 * * * *`, apontando para `POST /api/scheduled/commerce-maintenance`. Esse processo devolve claims expirados à fila e agenda remoções de grupos LuckPerms cujo período contratual terminou. A rota aceita somente chamadas autenticadas da plataforma e é idempotente; não utilize temporizadores em memória. [3]

## Diagnóstico de entregas

Cada instância Paper possui sua própria chave de servidor. O plugin utiliza a chave somente no cabeçalho `X-PlayStor-Server-Key` e obtém claims de curta duração. Entregas para jogadores offline retornam a `PENDING` sem consumir tentativa. Falhas de execução aplicam backoff exponencial e ficam disponíveis para reprocessamento administrativo.

| Evento | Verificação inicial |
| --- | --- |
| Pagamento não liberou item | Confirme a notificação no painel do gateway, os logs `payment.synchronized` e o `external_reference` do pedido. |
| Plugin não obtém entregas | Confira `api-base-url`, a chave do servidor, o status do servidor no painel e a conectividade HTTPS. |
| Jogador está offline | A entrega permanece pendente e será consultada novamente pelo plugin. |
| VIP não expirou | Confirme que a tarefa de manutenção está ativa e que LuckPerms está presente no servidor Paper. |

## Referências

[1] [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

[2] [Mercado Pago — Notificações de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)

[3] [Referência de tarefas periódicas do projeto](../server/_core/heartbeat.ts)
