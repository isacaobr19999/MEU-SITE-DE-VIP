# Validação de Produção — 20 de agosto de 2026

## Vitrine pública

A página inicial respondeu em `https://playstorcraft.com.br/` com os **11 benefícios ativos** do catálogo, carrinho, navegação pública e identidade visual Minecraft. A leitura confirmou itens Cash, Boosters e VIPs reais, sem produtos ou avaliações simuladas.

## Central operacional

A página `https://playstorcraft.com.br/status` foi acessada após a atualização. A estrutura da central, os quatro eixos operacionais e a atualização periódica foram carregados. A validação final confirmou Discord conectado, Paper online, **0/20** jogadores, **TPS 19,97**, **MSPT 0,88**, quatro pedidos em andamento, quatro pedidos processados, zero entregas na fila e zero entregas com atenção. Esses valores vieram dos serviços reais no momento da consulta.

## Serviços

O bot Discord foi autenticado com o token renovado e publicou status do Paper no canal configurado. A consulta pública opcional de contagem do convite retornou HTTP 404; o bot passou a usar a contagem do servidor Discord e essa resposta não interrompe mais a publicação do status.

## Verificação visual posterior

Após reiniciar o ambiente de desenvolvimento para limpar o cache de módulos, a vitrine foi capturada em desktop e em **375 × 812 px**. Em desktop, a hierarquia da capa, o contraste entre texto e fundo, a navegação e o carrinho permaneceram visíveis. Em celular, a marca, o botão de menu, o acesso à comunidade e o carrinho permanecem acessíveis no topo; a chamada principal, o botão de benefícios e o cartão de confiança se reorganizam verticalmente sem transbordamento observado.

## Notificações operacionais

O destino de operações foi configurado para o canal privado de staff **#📊-logs**. O bot foi recriado de forma controlada, reconectou como `PlayStorCraft#3693` e voltou a publicar o status do Paper. Eventos reais futuros de pagamento, entrega ou falha serão enviados pela fila idempotente já implantada; não foram gerados eventos artificiais apenas para teste.
