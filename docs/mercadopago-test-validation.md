# Validação Mercado Pago — ambiente de teste

Em 15 de agosto de 2026, o Access Token de teste foi validado pela consulta autenticada de meios de pagamento e uma preferência de Checkout Pro foi criada para a URL pública de webhook da PlayStorCraft.

O navegador automatizado foi direcionado às rotas sandbox e pública do Checkout Pro, mas a plataforma exibiu a rota específica para rastreadores nas duas tentativas, sem permitir o preenchimento do usuário de teste. Nenhum pagamento foi iniciado ou confirmado por esse navegador.

Em seguida, foi criado pela própria PlayStorCraft o pedido técnico `PSC-20260815-5B309E83`, no valor de R$ 1,00, vinculado ao servidor de validação e ao jogador técnico `PSTest`. O redirecionamento desse pedido também foi direcionado à rota de rastreadores do Mercado Pago, logo o pagamento ainda aguarda finalização no celular do usuário.

Após a correção para `sandbox_init_point`, o checkout exibiu o aviso de que uma das partes era de teste. Isso confirma que a preferência sandbox foi aberta, mas o navegador móvel ainda estava autenticado em uma conta normal do Mercado Pago. A compra deve ser repetida com o usuário comprador de teste fornecido pelo painel do Mercado Pago.

## Referências oficiais consultadas

O Checkout Pro do Mercado Pago para o Brasil oferece cartão, Pix, boleto e Conta Mercado Pago. A preferência criada pela API inclui por padrão os meios de pagamento disponíveis na conta; a loja não exclui Pix na configuração atual. O Mercado Pago também orienta realizar testes em janela anônima, usando a conta compradora de teste, para evitar conflitos com credenciais pessoais.

- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/overview
- https://www.mercadopago.com.ar/developers/pt/docs/checkout-pro/integration-test/test-purchases
- https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/create-payment-preference

Na documentação oficial brasileira de testes do Checkout Pro, o Mercado Pago orienta o uso de uma janela anônima, conta compradora de teste e cartão de teste; para aprovação, o cartão Mastercard `5480 8328 0103 3311`, validade `11/30`, código `123` deve ser combinado com titular `APRO` e CPF `12345678909`. A documentação também esclarece que vendedor e comprador de teste devem ser contas diferentes. Como o botão móvel do Checkout Pro permaneceu bloqueado para o navegador automatizado, foi considerada uma transação técnica de sandbox vinculada por referência externa.

- https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/integration-test/test-purchases
- https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/integration-test/test-payment-flow
- https://www.mercadopago.com.br/developers/en/docs/subscriptions/additional-content/cardtoken

## Recusas sandbox por prevenção a fraude

Em 15 de agosto de 2026, duas cobranças técnicas, sem qualquer valor real, foram enviadas ao ambiente de testes por API. A primeira, de ID `173022564123`, e a segunda, de ID `173021553017`, retornaram ambas o estado `rejected` com detalhe `cc_rejected_high_risk`. A segunda tentativa já usava exatamente o cartão, titular e CPF de aprovação publicados para o Brasil, em pedido técnico distinto. Por segurança, nenhuma outra tentativa automática será enviada.

O próprio Mercado Pago classifica `cc_rejected_high_risk` como uma recusa pela camada de prevenção a fraude e informa que tentativas consecutivas com itens ou parâmetros semelhantes podem acionar bloqueio temporário. O resultado, portanto, não indica aprovação, falha de estoque ou entrega; a cobrança foi recusada antes de qualquer confirmação de pagamento. A validação ponta a ponta ficará pendente até que o Checkout Pro seja concluído manualmente, em janela anônima, por uma conta compradora de teste diferente da vendedora.

O utilitário técnico de criação de cobrança agora está **bloqueado por padrão**. Uma execução futura exige que o responsável defina explicitamente `MERCADO_PAGO_ALLOW_SANDBOX_PAYMENT_EXECUTION=true` no mesmo comando, além de informar um pedido técnico. Essa barreira evita novos disparos acidentais e não afeta o Checkout Pro público da loja.

## Cobertura automatizada atualizada

Após a ampliação da cobertura, a suíte completa concluiu com 14 arquivos e 29 testes aprovados. Ela inclui regras de cupons e transições de pedido, validação de assinatura e eventos de webhook, aprovação/reprocessamento estável e os fluxos de deferimento offline, retry e conclusão idempotente da fila de entregas.

## Verificação de produção

O domínio `https://playstorcraft.com.br/` foi verificado após a atualização da VPS. A vitrine, navegação pública, catálogo, categoria de validação e produto técnico de R$ 1,00 foram carregados corretamente. A primeira captura ocorreu durante a transição de carregamento; uma nova inspeção confirmou a renderização completa do conteúdo e dos controles do catálogo.

O histórico autenticado exibiu os pedidos técnicos pendentes, e o detalhe do pedido apresentou produto, valor, estado `WAITING PAYMENT` e a instrução de que somente a confirmação do gateway disponibiliza a entrega.

O painel administrativo permaneceu acessível para a conta proprietária e exibiu o catálogo, o servidor de validação, o jogador técnico, a auditoria e os pedidos pendentes. As métricas permaneceram coerentes: nove pedidos ativos, nenhuma entrega pendente ou com erro e um jogador registrado.

Como alternativa oficial para validar Pix por API, a documentação do Mercado Pago descreve a criação de uma order de teste com o primeiro nome do pagador igual a `APRO`, o que resulta em aprovação automática no ambiente de teste. Essa rota é distinta do fluxo de Checkout Pro que a loja utiliza; portanto, ela serve para validar o gateway, mas não substitui a confirmação de um pedido real da loja via Checkout Pro.

## Referências complementares

- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-test/test-purchases
- https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/how-tos/improve-payment-approval/reasons-for-rejection
