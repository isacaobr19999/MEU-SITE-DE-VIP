# Verificação de catálogo e status em produção

Em 17 de agosto de 2026, a consulta direta à VPS confirmou que o catálogo de produção possui onze produtos comerciais ativos, distribuídos entre VIPs, Boosters e Cash. Os preços e comandos existentes foram preservados; nenhum produto, preço, avaliação ou regra de entrega foi inventado durante esta verificação.

A página pública `https://playstorcraft.com.br/status` foi disponibilizada após a sincronização do código validado. A página apresenta indicadores públicos do Discord, Paper, pagamentos, pedidos e entregas, além de atualização automática enquanto permanece aberta. A resposta pública foi verificada sem expor chaves, dados de clientes ou detalhes de pedidos.

Antes da sincronização, foram criados backups versionados do código e do banco na VPS. A aplicação e o MySQL foram então restaurados com as variáveis de runtime já existentes no servidor, e a resposta local da loja retornou HTTP 200.

Na vitrine, a categoria interna de validação de pagamento foi ocultada do público porque seu único produto permanece inativo. Os três textos de Booster foram normalizados para evitar caracteres incompatíveis na interface, sem alterar preço, duração, comando, destino ou disponibilidade. A nova abertura pública confirmou filtros apenas de VIPs, Boosters e Cash, além dos onze produtos comerciais ativos.

O fluxo público de carrinho foi verificado pela rota `/cart`. Um produto técnico inativo preservado apenas no armazenamento local de uma sessão anterior continuou acessível no carrinho dessa sessão, mas não estava disponível no catálogo. A continuidade abriu apenas o formulário de identificação do jogador; nenhum pedido foi criado, nenhum pagamento foi iniciado e nenhuma entrega foi gerada durante a verificação.

Após essa constatação, a vitrine passou a descartar automaticamente do armazenamento local itens que já não pertencem ao catálogo público ativo. O backend de criação de pedidos também passou a exigir que o destino esteja em um servidor ativo, além de já exigir produto e categoria ativos. A validação posterior de `/cart` confirmou a remoção do item técnico persistido e o carrinho vazio, sem criação de cobrança.
