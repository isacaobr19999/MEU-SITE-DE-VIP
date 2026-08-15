# Validação Mercado Pago — ambiente de teste

Em 15 de agosto de 2026, o Access Token de teste foi validado pela consulta autenticada de meios de pagamento e uma preferência de Checkout Pro foi criada para a URL pública de webhook da PlayStorCraft.

O navegador automatizado foi direcionado ao checkout sandbox, mas a plataforma exibiu a rota específica para rastreadores, sem permitir o preenchimento do usuário de teste. Nenhum pagamento foi iniciado ou confirmado por esse navegador.

Como alternativa oficial para validar Pix por API, a documentação do Mercado Pago descreve a criação de uma order de teste com o primeiro nome do pagador igual a `APRO`, o que resulta em aprovação automática no ambiente de teste. Essa rota é distinta do fluxo de Checkout Pro que a loja utiliza; portanto, ela serve para validar o gateway, mas não substitui a confirmação de um pedido real da loja via Checkout Pro.
