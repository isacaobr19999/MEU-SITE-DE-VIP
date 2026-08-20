# Validação de exclusão de cupons — 20 de agosto de 2026

Foi identificado que a exclusão de um cupom com histórico o arquivava corretamente no banco, mas a listagem administrativa continuava trazendo esse registro. Isso fazia a ação parecer inoperante apesar de o cupom já estar bloqueado para novas utilizações.

A consulta administrativa normal agora filtra cupons com `archivedAt`. Em produção, a seção **Cupons** do catálogo foi carregada sem os registros históricos arquivados, confirmando que a exclusão ou o arquivamento deixa de aparecer como falha para o administrador. Pedidos, usos e auditoria permanecem preservados no banco.
