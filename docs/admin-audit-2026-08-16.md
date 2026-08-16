# Auditoria inicial do painel administrativo

O painel publicado em `/admin` carregou para a conta administradora e exibiu métricas, categorias, formulário de produto, lista de pedidos, entregas, jogadores, servidores, cupons, administradores e auditoria. As ações visíveis incluem criar categoria, publicar produto, alternar status de produto, gerar chave de servidor, criar cupom e remover administrador.

O diagnóstico continuará pelo código do frontend, pelas rotas tRPC e pelo console do navegador para confirmar quais ações realmente executam mutações, quais não possuem formulários completos e quais retornam erro em produção.

## Falha reproduzida

No formulário protegido de edição do pacote `1.000 Cash`, o salvamento sem qualquer alteração retornou `imageUrl: Invalid URL`. O produto usa a URL relativa válida para a VPS `/store-assets/vip_cash.webp`, mas a validação tRPC aceita apenas URLs absolutas. Isso impede salvar qualquer produto comercial que use as imagens locais da loja e explica a percepção de que as ações do painel não funcionam.

A validação do backend foi ajustada para aceitar caminhos relativos seguros iniciados por `/` e URLs HTTP/HTTPS, recusando protocolos inseguros e URLs iniciadas por `//`. O painel principal também passou a exibir mensagens de erro para todas as mutações e a validar preço, destino e comandos antes de publicar produtos. A versão corrigida foi implantada e o catálogo administrativo recarregou normalmente em produção.

## Validação pós-correção

Em produção, o salvamento sem alterações do produto `1.000 Cash` foi concluído com a confirmação visual `Produto atualizado.`. O salvamento de categoria também foi confirmado com `Categoria atualizada.`. A central de operações carregou pedidos, entregas, jogadores, disponibilidade de servidores, categorias, cupons e auditoria; o botão `Detalhes` abriu corretamente o pedido técnico de VIP, incluindo item, duração e valor.
