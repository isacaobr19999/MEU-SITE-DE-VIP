# Validação de arquivo e limites de cupons — 20 de agosto de 2026

Em produção, o catálogo administrativo exibiu o cupom inativo `VALIDAEXP2026` com validade curta e limite total de um uso. Como o registro permanece inativo, não pode gerar desconto, pagamento ou entrega durante a validação.

Os seis cupons históricos com uso e pedidos vinculados foram marcados como `ARQUIVADO`. O backup SQL anterior à alteração foi salvo na VPS e a auditoria confirmou que os vínculos de uso e pedido foram preservados.

O painel também continuou acessível após a atualização, com a ação **Novo cupom** disponível para conferir o formulário de limite total de usos.
