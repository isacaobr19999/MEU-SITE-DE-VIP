# Validação de comunicação de manutenção — 20/08/2026

## Teste controlado no Discord

Foi enfileirado um evento `STORE_MAINTENANCE_TEST` sem alterar o estado público da loja. O bot consumiu a notificação e o banco registrou o estado `SENT`. A loja permaneceu disponível durante a validação e respondeu HTTP 200.

## Revisão da página pública

A rota `/maintenance-history` foi revisada em viewport desktop (1280×720) e móvel (375×812). O cabeçalho, o link de retorno e o estado vazio ficaram legíveis nos dois tamanhos. A página exibe somente o resumo seguro de manutenções concluídas; não inclui motivos internos, pedidos ou dados administrativos.
