# Validação administrativa de cupons — 20 de agosto de 2026

O catálogo administrativo foi aberto em produção após a atualização da aplicação. A transição de carregamento foi concluída sem o erro React #310 anteriormente observado. Os seis cupons existentes foram apresentados com seu estado `DESATIVADO`, a indicação explícita `Sem expiração` e as ações **Editar** e **Excluir**.

A exclusão agora está acessível tanto no painel principal quanto no catálogo. Antes de enviar a ação, a interface explica que um cupom com usos será desativado, em vez de apagado, para preservar histórico e impedir novas utilizações. O backend já diferencia os dois resultados e a interface informa qual ocorreu.

O formulário de criação passou a aceitar `Disponível a partir de` e `Expira em`, com o resumo da validade selecionada. A API também rejeita uma expiração anterior ou igual ao início.
