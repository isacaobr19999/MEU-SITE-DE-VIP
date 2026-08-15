# Validação visual de produção — 15 de agosto de 2026

## Vitrine pública

A página inicial em `https://playstorcraft.com.br/` carregou com navegação, busca, categoria e produto técnico visíveis. O catálogo exibiu o produto **Validação técnica de pagamento**, classificado como VIP permanente no valor de **R$ 1,00**. A versão de desenvolvimento também foi verificada visualmente em desktop e em viewport móvel de 375 × 812; a hierarquia, os botões e o empilhamento das seções permaneceram legíveis e navegáveis.

A página pública de detalhe do produto também foi aberta em produção. O nome, descrição, preço, duração e servidor de destino foram exibidos corretamente. A ação **Adicionar ao carrinho** retornou a confirmação visual de inclusão sem iniciar checkout ou pagamento.

## Painel administrativo

Com a sessão administrativa já autenticada, `/admin` carregou as métricas e os formulários para criar categorias, produtos, servidores e cupons. A página também mostrou o servidor técnico ativo, a conta administrativa e a auditoria recente. Os dois pedidos vinculados às cobranças sandbox recusadas aparecem como `FAILED`, sem entregas pendentes nem erros de entrega, o que está coerente com a ausência de confirmação de pagamento.

## Limites desta inspeção

Esta verificação foi visual e não substitui o teste de uma compra real aprovada. A aprovação fim a fim via Checkout Pro continua pendente do uso manual de uma conta compradora de teste, em janela anônima, ou da ativação posterior de credenciais reais.

## Histórico e detalhe de pedidos

O histórico autenticado exibiu os pedidos técnicos com estados e totais, inclusive as duas recusas sandbox como `FAILED`. No detalhe de um pedido recusado, o estado foi exibido sem indicar entrega liberada. Foi identificada, contudo, uma mensagem informativa genérica de confirmação futura que deve ser substituída por uma comunicação específica para estados `FAILED`, deixando claro que o pagamento não foi aprovado e que não há entrega disponível.
