# Auditoria para reorganização do PlayCraftBR

Data da auditoria: 17 de agosto de 2026.

O servidor PlayCraftBR está acessível pela conta autenticada e possui uma estrutura inicial voltada a Minecraft, mas ainda mistura nomenclaturas, canais limitados e áreas que podem ser reorganizadas. Foram identificadas as categorias `📌 INÍCIO`, `WHITELIST`, `🌍 COMUNIDADE`, `💰 ECONOMIA / LOJA`, `🎪 EVENTOS` e `🎙️ VOZ (BIOMAS)`, além dos canais `modlogs`, `get-roles`, regras, anúncios, como entrar, verificação, pegar cargos, pedido/status de whitelist, chat geral, prints e clipes, mostra sua base, sugestões, enquetes, loja oficial, entregas e status, trocas e mercado, regras do mercado, agenda/inscrições/resultados de eventos e canais de voz por bioma.

Também foi confirmado que `#anuncios` é o canal atualmente configurado para a geração automática do convite permanente do bot PlayStorCraft. Essa referência deve ser preservada ou atualizada no runtime caso o canal seja renomeado ou substituído.

A reorganização recomendada será não destrutiva na primeira etapa: criar uma estrutura nova e organizada, mover/renomear canais somente após validação, preservar `modlogs`, preservar o canal usado pelo bot até a automação ser reconfigurada e não apagar mensagens, membros ou cargos sem confirmação explícita. A proposta deverá separar claramente informações e regras, entrada e verificação, comunidade Minecraft, suporte/whitelist, loja PlayStorCraft, eventos, voz e staff.

## Alterações aplicadas na primeira etapa

Após a confirmação do usuário, foram criados sem apagar canais existentes: `👋・boas-vindas` e `🟢・status-do-servidor` na categoria `📌 INÍCIO`; `🎫・abrir-ticket` na categoria `WHITELIST`; `🐛・reportar-bug` na categoria `🌍 COMUNIDADE`; e `🎁・cupons` na categoria `💰 ECONOMIA / LOJA`. Os canais antigos e suas mensagens permanecem intactos. O `#anuncios` existente continua preservado para não interromper a automação do convite e os avisos atuais do bot.

## Limpeza confirmada

A auditoria identificou um bloco adicional de canais Minecraft criado anteriormente. Os canais `regras`, `changelog`, `geral`, `midia`, `comandos`, `status-servidor`, `ip-servidor` e `denuncias` estão vazios e serão removidos por serem duplicados ou redundantes. O canal `login-no-servidor` possui histórico e será preservado. O canal `anuncios` permanecerá intacto porque é usado pelo bot para convites e avisos. Os canais principais da estrutura PlayCraftBR também serão mantidos.
 A edição do canal `📸-prints-e-clipes` foi aberta acidentalmente durante a auditoria e fechada sem alterações; nenhum canal preservado foi modificado.
 O canal vazio `regras` foi removido com confirmação; os canais oficiais de regras permanecem preservados.
 Foram removidos os canais vazios `changelog`, `geral`, `midia`, `comandos`, `status-servidor`, `ip-servidor` e `denuncias`. A categoria adicional de comunidade ficou sem canais; sua remoção será confirmada por uma nova leitura da estrutura, sem tocar na categoria principal `🌍 COMUNIDADE` nem nos canais essenciais.
 A categoria vazia `💬 COMUNIDADE` foi removida com confirmação. A categoria principal `🌍 COMUNIDADE` e os canais públicos essenciais permanecem intactos.
 A consulta direta de cargos pela sessão web retornou 401; a configuração de cargos e permissões será feita pela interface administrativa autenticada do Discord, sem expor tokens.

## Auditoria de cargos

A configuração do servidor já possui cargos funcionais para `Bot`, `Dono`, `Ticket Tool`, `ProBot`, `Dyno`, `Carl-bot`, `Admin`, `Mod`, `Ajudante`, `Vips`, `Membro`, `Novatos`, `Loja`, `Eventos` e `Mutados`. Não criei cargos duplicados; essa hierarquia atende à comunidade Minecraft e preserva as permissões dos bots existentes.

## Configuração operacional final — 17/08/2026

- O bot PlayStorCraft#3693 recebeu somente a permissão global adicional de enviar mensagens, mantendo criar convite instantâneo; nenhuma permissão de administrador ou gerenciamento foi concedida.
- No canal `🟢・status-do-servidor` (`1538821276683079801`), o override específico do bot foi salvo com `View Channel` e `Send Messages` permitidos (`allow=3072`), enquanto o bloqueio geral permanece aplicado aos demais membros.
- O bot foi reiniciado e publicou com sucesso o status do Paper no canal: `Status do Paper publicado no canal 1538821276683079801`; também atualizou a ponte com 7 membros e 4 online.
- Foram publicadas orientações iniciais nos canais `📜-regra`, `🧭-como-entrar` e `🎫・abrir-ticket`, com regras Minecraft, instruções de acesso e fluxo de suporte.
- Não foram expostos tokens ou credenciais neste registro.

## Auditoria para configuração total — 17/08/2026

A estrutura atual contém as categorias `📌 INÍCIO`, `WHITELIST`, `🌍 COMUNIDADE` e `💰 ECONOMIA / LOJA`, além de áreas de eventos e voz. Os canais essenciais estão presentes: regras, anúncios, como entrar, verificação, pegar cargos, boas-vindas, status do servidor, whitelist, tickets, comunidade, reportes e loja. Muitos canais aparecem como limitados/privados para a conta comum, enquanto `🟢・status-do-servidor` está acessível ao bot e à comunidade.

A matriz operacional definida é: informações e comunidade com leitura para membros; anúncios, regras, boas-vindas, status e loja com publicação restrita à equipe/bot; whitelist e tickets com acesso controlado; modlogs e áreas de staff somente para equipe; e `PlayStorCraft#3693` com o mínimo necessário para criar convites e publicar status. A configuração deve preservar os cargos existentes e não remover históricos.
