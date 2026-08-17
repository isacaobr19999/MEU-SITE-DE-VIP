# Reconciliação da limpeza Discord

A estrutura atual foi lida diretamente do DOM autenticado do Discord em 17/08/2026. Os canais oficiais com emoji ainda aparecem no DOM após a tentativa de remoção: `📜-regra` ID `1492895577577357475`, `📢-anúncios` ID `1492895622670581932`, `🧭-como-entrar` ID `1492895667100844202`, `✅-verificação` ID `1492895704987992075` e `🎭-pegar-cargos` ID `1492895772327546961`. Como o DOM ainda os lista, a remoção dos dois primeiros não foi confirmada de forma confiável; não executar novas exclusões desses IDs.

Canais ativos preservados: `get-roles` `1492893208626331738`, `🟢・status-do-servidor` `1538821276683079801`, `💬-chat-geral` `1492896718969110670`, `📸-prints-e-clipes` `1492896761801605321`, `🧱-mostra-sua-base` `1492896832903184548`, `🎫・abrir-ticket` `1538821398120763423`, `📊-logs` `1492898167405150268`, loja, eventos e áreas privadas.

O único canal antigo sem emoji claramente visível no DOM é `anuncios` ID `1495035640751067238`; outros canais antigos sem emoji podem não estar carregados na lista atual. Não remover por nome parcial. Próxima ação segura: confirmar o estado real dos dois canais oficiais com emoji e só então auditar/remover canais antigos sem emoji por IDs exatos.


## Validação visual após remoção das salas de voz

A gravação enviada em 17/08/2026 mostra `modlogs`, `get-roles`, a categoria `📌 INÍCIO` com `📜-regra`, `📢-anúncios`, `🧭-como-entrar`, `✅-verificação`, `🎭-pegar-cargos`, `👋・boas-vindas` e `🟢・status-do-servidor`; também mostra WHITELIST, COMUNIDADE e ECONOMIA / LOJA. O segundo quadro confirma que os dois canais oficiais com emoji permanecem visíveis e que `modlogs` e `get-roles` continuam presentes. A gravação não mostra a parte de tickets/staff no mesmo quadro, mas a captura anterior confirmava `#🎫・abrir-ticket`, `📊-logs`, `📌-painel-staff`, `🧾-ocorrências` e `🤖-comandos-bots`. O serviço de análise automática do vídeo não estava disponível; a validação foi feita por extração local de quadros.
