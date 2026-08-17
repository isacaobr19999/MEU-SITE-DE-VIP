# Auditoria para reorganização do PlayCraftBR

Data da auditoria: 17 de agosto de 2026.

O servidor PlayCraftBR está acessível pela conta autenticada e possui uma estrutura inicial voltada a Minecraft, mas ainda mistura nomenclaturas, canais limitados e áreas que podem ser reorganizadas. Foram identificadas as categorias `📌 INÍCIO`, `WHITELIST`, `🌍 COMUNIDADE`, `💰 ECONOMIA / LOJA`, `🎪 EVENTOS` e `🎙️ VOZ (BIOMAS)`, além dos canais `modlogs`, `get-roles`, regras, anúncios, como entrar, verificação, pegar cargos, pedido/status de whitelist, chat geral, prints e clipes, mostra sua base, sugestões, enquetes, loja oficial, entregas e status, trocas e mercado, regras do mercado, agenda/inscrições/resultados de eventos e canais de voz por bioma.

Também foi confirmado que `#anuncios` é o canal atualmente configurado para a geração automática do convite permanente do bot PlayStorCraft. Essa referência deve ser preservada ou atualizada no runtime caso o canal seja renomeado ou substituído.

A reorganização recomendada será não destrutiva na primeira etapa: criar uma estrutura nova e organizada, mover/renomear canais somente após validação, preservar `modlogs`, preservar o canal usado pelo bot até a automação ser reconfigurada e não apagar mensagens, membros ou cargos sem confirmação explícita. A proposta deverá separar claramente informações e regras, entrada e verificação, comunidade Minecraft, suporte/whitelist, loja PlayStorCraft, eventos, voz e staff.

## Alterações aplicadas na primeira etapa

Após a confirmação do usuário, foram criados sem apagar canais existentes: `👋・boas-vindas` e `🟢・status-do-servidor` na categoria `📌 INÍCIO`; `🎫・abrir-ticket` na categoria `WHITELIST`; `🐛・reportar-bug` na categoria `🌍 COMUNIDADE`; e `🎁・cupons` na categoria `💰 ECONOMIA / LOJA`. Os canais antigos e suas mensagens permanecem intactos. O `#anuncios` existente continua preservado para não interromper a automação do convite e os avisos atuais do bot.
