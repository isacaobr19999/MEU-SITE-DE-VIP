# Validação inicial do catálogo comercial

Em 16 de agosto de 2026, a página pública `https://playstorcraft.com.br/` foi aberta após a publicação dos produtos. A seção de catálogo exibiu o título, a busca e o filtro `Todos`, mas nenhum card de produto foi renderizado naquele primeiro carregamento. O console do navegador não apresentou erros.

A verificação direta no banco confirmou cinco VIPs e três Boosters ativos; a categoria Cash ainda estava inativa. A investigação continua para identificar por que a resposta pública do catálogo não refletiu os produtos ativos, antes de comunicar a ativação como concluída.

A consulta pública ao endpoint de catálogo confirmou resposta HTTP 200 com os cinco VIPs e três Boosters ativos. Os produtos de Cash estavam corretamente publicados no banco, mas não eram retornados porque a categoria `cash` permanecia inativa. A primeira captura visual ocorreu antes da conclusão da consulta assíncrona; será repetida após a correção da categoria Cash.

A categoria Cash foi publicada e o endpoint passou a retornar os onze produtos aprovados. A validação visual seguinte confirmou a presença dos filtros VIPs, Boosters e Cash, dos onze cards e dos preços aprovados. Nessa mesma verificação, foi detectado que as imagens ainda retornavam HTTP 500 pela rota anterior de armazenamento; os arquivos foram movidos para uma rota estática da VPS e as URLs dos produtos foram atualizadas. A aplicação foi reconstruída e as variáveis de runtime foram restauradas explicitamente após a recriação do contêiner, com consulta local do catálogo confirmada.

Após a recriação da aplicação, a nova abertura no navegador exibiu uma página em branco. A página será diagnosticada pelos registros de produção e pela resposta HTML antes de a correção visual ser considerada concluída.

A causa da página em branco foi um conflito entre a rota Nginx `/assets/` usada para as imagens e a mesma rota usada pelos arquivos JavaScript e CSS compilados. As imagens foram movidas para `/store-assets/`, o conflito foi removido e a página voltou a carregar os onze cards e preços aprovados. O HTML passou a apontar para as novas URLs, mas a captura do navegador ainda mostrou o texto alternativo do banner; a disponibilidade das imagens no navegador seguirá em validação específica antes do encerramento.

A indisponibilidade residual do banner foi causada pela permissão de leitura restrita do arquivo copiado para a VPS. Após a correção das permissões, a validação visual em produção confirmou o banner renderizado, as imagens reais de Cash, Booster e VIP nos cards, todos os onze produtos, suas categorias e os preços aprovados.

No painel administrativo protegido em `/admin/catalog`, os produtos publicados, preços, estados ativos e destinos foram exibidos corretamente. A edição do pacote `1.000 Cash` confirmou a URL de imagem `/store-assets/vip_cash.webp`, o comando de crédito e o destino marcado como `Servidor de validação` (SURVIVAL). Esse é o registro autenticado pelo plugin Paper; a confirmação nominal do titular ainda é necessária antes de encerrar a ativação comercial.

## Teste técnico controlado do VIP

Com autorização explícita do titular, foi criada uma entrega sintética sem pagamento para o jogador `_Nube` no produto VIP Ferro, direcionada ao servidor Paper autenticado. O jogador entrou no servidor, o plugin PlayStorCraft reivindicou a entrega, o Paper executou o marcador `@luckperms:add:ferro`, a entrega ficou `COMPLETED` e a tabela `vip_grants` registrou o grupo `ferro` com expiração de 30 dias. Em seguida, somente o grant sintético foi expirado, a manutenção autenticada enfileirou `@luckperms:remove:ferro`, e o Paper concluiu a revogação; o grant ficou com `revokedAt` preenchido e a entrega de remoção ficou `COMPLETED`. Nenhum pagamento ou pedido comercial foi criado.

## Diagnóstico do painel

A indisponibilidade relatada no painel não foi reproduzida na infraestrutura: o DNS de `panel.playstorcraft.com.br` resolve para a VPS, HTTPS retorna HTTP 200 e a página de login do Pterodactyl é entregue pelo Nginx. O serviço do painel não aparece como uma unidade systemd independente, mas o Nginx está ativo e servindo a aplicação. O bloqueio observado no navegador é a exigência de autenticação do painel, não uma falha de DNS ou HTTPS.

## Banner público — revalidação

Após a revalidação atual, a URL `/store-assets/PlayStorCraft-Banner.webp` respondeu `200 image/webp` e serviu um arquivo WebP válido de 237.010 bytes. A abertura visual da página inicial publicada exibiu novamente a arte completa do PlayStorCraft no estágio principal, sem texto alternativo nem falha de carregamento.
