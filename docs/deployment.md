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

### Ativação controlada na VPS

Na VPS auto-hospedada, as variáveis são mantidas em `/root/playstorcraft-runtime`, com permissão `600`. A URL pública `APP_BASE_URL=https://playstorcraft.com.br` deve permanecer nesse arquivo para que uma recriação do contêiner preserve os retornos do Checkout Pro e o endereço de notificação. Em 15 de agosto de 2026, essa URL foi conferida no contêiner em execução e registrada no arquivo de runtime.

| Etapa | Procedimento seguro | Critério para avançar |
| --- | --- | --- |
| 1. Credenciais | Substituir apenas `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY` e `MERCADO_PAGO_WEBHOOK_SECRET` pelos valores reais da conta vendedora. Nunca inserir valores no código ou no navegador. | Os três valores estão configurados e o contêiner foi recriado. |
| 2. Webhook | No painel do Mercado Pago, manter `https://playstorcraft.com.br/api/webhooks/mercadopago` no tópico **Pagamentos**. | O endpoint recebe a notificação assinada. |
| 3. Compra controlada | Efetuar uma compra real de baixo valor, em pedido identificável, e aguardar a confirmação do gateway. | O pedido passa para `PAID` somente após a consulta autenticada do pagamento. |
| 4. Entrega | Confirmar no painel a auditoria `payment.synchronized` e o claim da fila de entregas. | O plugin recebe o comando uma única vez ou o posterga se o jogador estiver offline. |

> O executor técnico de cobrança sandbox está bloqueado por padrão. Ele só pode ser usado depois de autorização explícita, por meio da variável efêmera `MERCADO_PAGO_ALLOW_SANDBOX_PAYMENT_EXECUTION=true`; esse bloqueio não interfere no Checkout Pro da loja.

### Transição para vendas reais

Na ativação comercial final, use as credenciais de produção obtidas na conta vendedora real do Mercado Pago, não nas contas de teste. Os valores permanecem exclusivamente no runtime protegido da VPS; não devem ser enviados em capturas de tela, incorporados no código ou usados no frontend. A primeira cobrança real deve permanecer de baixo valor e ser acompanhada até o pedido, webhook e fila de entrega confirmarem o fluxo completo.

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
