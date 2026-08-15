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

Após a ampliação da cobertura, a suíte completa concluiu com 18 arquivos e 46 testes aprovados. Ela inclui regras de cupons e transições de pedido, validação de assinatura e eventos de webhook, aprovação/reprocessamento estável, cadastro local, operações administrativas críticas e os fluxos de deferimento offline, retry e conclusão idempotente da fila de entregas.

## Dependências externas para concluir pagamentos

| Dependência | Situação atual | Próxima ação necessária |
| --- | --- | --- |
| Aprovação de checkout sandbox | Bloqueada pelo antifraude em tentativas automatizadas; nenhuma cobrança real foi criada. | Concluir manualmente o Checkout Pro em janela anônima, com conta compradora de teste diferente da conta vendedora. |
| Pix em ambiente real | A preferência da loja não exclui Pix, mas a disponibilidade é definida pelo Mercado Pago e pela conta vendedora. | Confirmar Pix habilitado no painel do Mercado Pago após disponibilizar as credenciais reais. |
| Pagamento real de validação | Ainda não realizado para evitar cobrança antes da ativação comercial. | Após receber as credenciais reais, realizar uma compra de baixo valor, confirmar o webhook e acompanhar uma entrega. |

> A aplicação e a VPS já estão preparadas para essas etapas: a URL HTTPS pública, a verificação de assinatura, a consulta autenticada do pagamento e a fila idempotente de entrega permanecem configuradas. O passo restante depende exclusivamente de ações na conta Mercado Pago e de uma conta compradora de teste ou de credenciais reais.

## Incidente de pagamento informado pelo usuário

Em 15 de agosto de 2026, após o relato de erro ao tentar pagar, foi localizado o pedido `PSC-20260815-6E7C7B06`, no valor de R$ 1,00. O pedido permanece em `WAITING_PAYMENT` e seu registro de pagamento permanece `PENDING`, sem identificador de pagamento do Mercado Pago. A preferência foi criada corretamente no sandbox e aponta para a referência externa esperada, mas a consulta autenticada ao Mercado Pago não retornou nenhuma cobrança vinculada a essa referência, nem a listagem recente do gateway retornou uma nova aprovação ou recusa. A fila de entregas foi consultada diretamente e retornou **zero** entregas para esse pedido.

> Portanto, não houve cobrança confirmada nem webhook recebido para esse pedido. O erro ocorreu antes da criação de um pagamento pelo Mercado Pago; não há item liberado nem valor a ser estornado pela PlayStorCraft.

O usuário confirmou que o Checkout Pro exibiu a mensagem: **"Uma das partes com as quais você está tentando efetuar o pagamento é de teste."** Esse retorno confirma que a preferência sandbox foi aberta corretamente e que a tentativa usou uma conta que não é a conta compradora de teste exigida pelo Mercado Pago. A correção não exige mudança no código da loja: o próximo teste deve usar uma conta compradora de teste distinta da conta vendedora, sem cobrar valor real.

Para o próximo teste, a documentação oficial do Mercado Pago orienta: criar ou localizar uma conta de teste do tipo **Buyer** no mesmo país da conta vendedora; usar o usuário, senha e, se solicitado, o código de verificação da própria conta de teste; abrir a loja em uma janela anônima; e iniciar o Checkout Pro usando essa sessão. O Mercado Pago também recomenda cartão de teste para simular aprovação, sem uso de cartão ou saldo real. [1] [2]

A conta compradora de teste brasileira foi identificada pelo usuário nas telas de Contas de teste. Por segurança, seus dados de acesso não são armazenados nesta documentação nem repetidos em mensagens. O procedimento é encerrar a sessão normal do Mercado Pago, abrir uma guia anônima, autenticar exclusivamente com a conta marcada como **Comprador** e então iniciar novamente o checkout de R$ 1,00 na loja.

Na tentativa seguinte, o navegador do usuário apresentou `ERR_TOO_MANY_REDIRECTS` em `sandbox.mercadopago.com.br`. Esse é um loop de sessão do checkout sandbox e ocorreu antes da criação de pagamento, sem webhook ou entrega. A preferência da loja continua válida; a verificação seguinte deve confirmar os back URLs e as regras de redirecionamento retornadas pelo Mercado Pago.

A preferência afetada foi consultada diretamente. Seus três `back_urls` apontam para a página HTTPS do pedido em `playstorcraft.com.br`, `auto_return` está configurado somente para aprovação e `notification_url` aponta para o webhook público da loja. Isso está alinhado ao formato oficial de Checkout Pro; portanto, não há loop entre a loja e o Mercado Pago. O redirecionamento excessivo está restrito à sessão/cookies do ambiente sandbox. [3]

O usuário repetiu o acesso com a conta compradora de teste e o mesmo `ERR_TOO_MANY_REDIRECTS` persistiu. Como o erro é reproduzível no próprio domínio sandbox após a separação correta das contas, novas tentativas pelo celular foram interrompidas. O teste fim a fim permanece bloqueado por uma limitação externa do ambiente sandbox, não por configuração da preferência, do retorno HTTPS, do webhook ou da fila de entrega.

Após a repetição, o pedido continuou em `WAITING_PAYMENT`, o registro de pagamento em `PENDING`, sem identificador do gateway, e a fila permaneceu com zero entregas. Isso confirma novamente que não houve cobrança aprovada, webhook recebido ou entrega liberada.

Após a correção e implantação na VPS, um novo pedido técnico foi criado. Seu registro local confirma `checkoutUrl` em `https://www.mercadopago.com.br/checkout/v1/redirect`, sem o subdomínio `sandbox.mercadopago.com.br` que apresentava o loop. A preferência aguarda somente a conclusão manual da compra de teste e não criou cobrança, webhook ou entrega até o momento.

## Validação comercial controlada

Em 15 de agosto de 2026, uma compra real e autorizada de **R$ 1,00** foi concluída por uma conta compradora normal diferente da conta vendedora. O pedido `PSC-20260815-8BECFC11` passou para `PAID`, com pagamento `APPROVED` e identificador do Mercado Pago registrado. O proxy registrou a notificação WebHook do Mercado Pago com resposta HTTP 200, confirmando o processamento assinado no endpoint público.

A fila criou uma entrega única para o pedido, inicialmente em `PENDING`, sem claim, erro ou tentativa consumida. Esse comportamento é esperado enquanto o plugin Paper não consulta a fila no servidor Minecraft; a entrega permanece segura e pronta para o próximo claim, sem duplicação.

Esta validação confirma o fluxo técnico de pagamento, webhook e fila sob as credenciais atualmente instaladas. A ativação comercial ampla permanece condicionada à confirmação de que essas são as credenciais da conta vendedora final do usuário, e não de uma conta de teste usada durante o diagnóstico.

O titular confirmou que a conta **IsacaoBR** configurada na VPS é sua conta vendedora real e definitiva. Com isso, as credenciais já validadas passam a ser tratadas como credenciais comerciais da PlayStorCraft.

Na validação de produção, o Checkout Pro abriu o método **Pix** para o produto de R$ 1,00. A conta autenticada nessa tentativa era a própria conta vendedora configurada na loja, e o Mercado Pago desabilitou a criação do Pix. Isso é o comportamento esperado para impedir auto pagamento; a compra controlada deve ser concluída usando uma segunda conta normal, distinta da conta vendedora.

Na tentativa de pagar por esse novo endereço, o Mercado Pago voltou a informar que uma das partes é de teste. Como o redirecionamento já foi corrigido, a investigação passa a verificar se o Access Token configurado na VPS pertence à mesma conta vendedora de teste da conta compradora usada pelo usuário.

A consulta autenticada ao token configurado na VPS identificou uma conta brasileira diferente das contas **Seller Test User** exibidas pelo usuário. Portanto, a conta compradora de teste está correta, mas o token atual não pertence ao vendedor de teste correspondente. Essa incompatibilidade explica a mensagem de que uma das partes é de teste. Para concluir o teste, a VPS deverá receber as credenciais da aplicação criada dentro da conta marcada como **Vendedor** nas Contas de teste; não devem ser usadas as credenciais da conta normal.

## Referências do diagnóstico

[1] [Mercado Pago — Perform test purchases](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/integration-test/test-purchases)

[2] [Mercado Pago — Test accounts](https://www.mercadopago.com.ar/developers/en/docs/your-integrations/test/accounts)

[3] [Mercado Pago — Configure return URLs](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/configure-back-urls)

## Verificação de produção

O domínio `https://playstorcraft.com.br/` foi verificado após a atualização da VPS. A vitrine, navegação pública, catálogo, categoria de validação e produto técnico de R$ 1,00 foram carregados corretamente. A primeira captura ocorreu durante a transição de carregamento; uma nova inspeção confirmou a renderização completa do conteúdo e dos controles do catálogo.

O histórico autenticado exibiu os pedidos técnicos pendentes, e o detalhe do pedido apresentou produto, valor, estado `WAITING PAYMENT` e a instrução de que somente a confirmação do gateway disponibiliza a entrega.

O painel administrativo permaneceu acessível para a conta proprietária e exibiu o catálogo, o servidor de validação, o jogador técnico, a auditoria e os pedidos pendentes. As métricas permaneceram coerentes: nove pedidos ativos, nenhuma entrega pendente ou com erro e um jogador registrado.

Como alternativa oficial para validar Pix por API, a documentação do Mercado Pago descreve a criação de uma order de teste com o primeiro nome do pagador igual a `APRO`, o que resulta em aprovação automática no ambiente de teste. Essa rota é distinta do fluxo de Checkout Pro que a loja utiliza; portanto, ela serve para validar o gateway, mas não substitui a confirmação de um pedido real da loja via Checkout Pro.

## Referências complementares

- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-test/test-purchases
- https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/how-tos/improve-payment-approval/reasons-for-rejection
