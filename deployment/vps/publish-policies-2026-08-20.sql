-- Rascunhos operacionais revisáveis; executar no MySQL da VPS com UTF-8.
SET NAMES utf8mb4;

INSERT INTO community_posts (slug, kind, title, summary, body, published, publishedAt, position)
VALUES
(
  'privacidade',
  'POLICY',
  'Privacidade e dados da PlayStorCraft',
  'Como a loja utiliza dados de conta, pedidos, pagamentos e entregas para operar com segurança.',
  'Versão publicada em 20/08/2026.\n\nA PlayStorCraft trata os dados necessários para criar e proteger contas, registrar pedidos, confirmar pagamentos, entregar benefícios no servidor Minecraft e atender solicitações de suporte. Esses dados podem incluir nome de usuário Minecraft, UUID resolvido pelo servidor, e-mail, dados do pedido, status de pagamento, histórico de entrega e registros técnicos de segurança.\n\nO processamento de pagamentos é realizado pelo Mercado Pago. A PlayStorCraft não armazena o número completo do cartão ou outros dados completos de pagamento processados pelo provedor. Informações estritamente necessárias podem ser compartilhadas com o Mercado Pago, a infraestrutura de hospedagem, o servidor Paper e os operadores autorizados do suporte para executar a compra, a entrega, a segurança e o atendimento.\n\nOs dados são mantidos pelo período necessário à operação, à prevenção de fraudes, à resolução de atendimento e às obrigações aplicáveis. A PlayStorCraft adota controles de acesso e separação de credenciais para reduzir exposição indevida; nenhuma medida técnica elimina todos os riscos de segurança.\n\nPara solicitar esclarecimentos, correção ou revisão de dados ligados a uma compra, contate canaldonube@gmail.com e informe o e-mail da compra, o número do pedido, quando houver, e o nome Minecraft. Esta política poderá ser atualizada quando a operação da loja mudar; a versão publicada na loja será a referência aplicável ao uso futuro.',
  1,
  UTC_TIMESTAMP(),
  10
),
(
  'reembolso',
  'POLICY',
  'Reembolso, entrega e suporte de compra',
  'Como solicitar análise de cobrança, entrega ou divergência em um pedido digital.',
  'Versão publicada em 20/08/2026.\n\nAntes de comprar, confirme o produto, o período do benefício e o nome Minecraft informado no checkout. Após a confirmação do pagamento, a PlayStorCraft cria uma entrega automatizada para o servidor; quando o jogador estiver offline, a entrega pode permanecer pendente até que o servidor possa concluí-la de forma segura.\n\nSolicitações relacionadas a cobrança em duplicidade, pagamento aprovado sem entrega, falha material de entrega ou divergência no pedido serão analisadas individualmente. Para abrir a análise, envie um e-mail para canaldonube@gmail.com com o número do pedido, o e-mail utilizado, o nome Minecraft, a data aproximada e uma descrição objetiva do problema. Poderá ser solicitada evidência adicional para localizar a transação e prevenir fraude.\n\nBenefícios digitais já entregues corretamente à conta Minecraft indicada exigem análise cuidadosa, pois podem ser utilizados imediatamente no servidor. A PlayStorCraft preserva os direitos do consumidor que sejam aplicáveis e não usa esta política para restringir garantias obrigatórias. Quando um reembolso for aprovado, o processamento seguirá o meio de pagamento e os prazos operacionais do provedor.\n\nEsta política não substitui o suporte: se uma entrega não aparecer ou houver dúvida antes da compra, entre em contato com a equipe antes de realizar nova tentativa de pagamento.',
  1,
  UTC_TIMESTAMP(),
  20
)
ON DUPLICATE KEY UPDATE
  kind = VALUES(kind),
  title = VALUES(title),
  summary = VALUES(summary),
  body = VALUES(body),
  published = VALUES(published),
  publishedAt = VALUES(publishedAt),
  position = VALUES(position);
