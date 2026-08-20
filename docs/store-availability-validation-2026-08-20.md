# Validação do controle de disponibilidade — 20 de agosto de 2026

O painel administrativo em produção exibe a seção **Disponibilidade da loja** com a condição atual `Loja pública online`, mensagem de manutenção editável e os botões **Deixar online** e **Deixar offline**.

O controle é protegido por procedimento administrativo, registra a alteração em auditoria e persiste em configuração singleton. Quando definido como offline, a área pública mostra a página de manutenção e o backend bloqueia tanto novos pedidos quanto o início de checkout. As rotas `/admin` e `/login` permanecem acessíveis para reativação.

Durante esta validação, a loja foi mantida online; nenhum pedido, pagamento, entrega ou status comercial foi alterado.
