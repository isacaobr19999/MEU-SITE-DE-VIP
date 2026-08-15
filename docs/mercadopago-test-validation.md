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

Como alternativa oficial para validar Pix por API, a documentação do Mercado Pago descreve a criação de uma order de teste com o primeiro nome do pagador igual a `APRO`, o que resulta em aprovação automática no ambiente de teste. Essa rota é distinta do fluxo de Checkout Pro que a loja utiliza; portanto, ela serve para validar o gateway, mas não substitui a confirmação de um pedido real da loja via Checkout Pro.
