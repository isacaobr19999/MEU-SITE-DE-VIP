# Procedimento operacional de tickets — PlayCraftBR

## Objetivo

Este procedimento define como a equipe deve atender, registrar, fechar e arquivar chamados criados pelo Ticket Tool no servidor PlayCraftBR.

## Abertura e triagem

O jogador deve abrir um ticket em `#🎫・abrir-ticket`, informar o nick no Minecraft e descrever o problema com o máximo de detalhes possível. A equipe deve verificar se o chamado foi criado dentro da categoria `🧰 SUPORTE (INGRESSOS)` e se apenas o autor, o Ticket Tool e os cargos oficiais de suporte conseguem visualizar o canal.

A primeira resposta deve confirmar o recebimento e classificar o assunto como suporte técnico, compra/pagamento, entrega de benefício, denúncia ou dúvida geral. Quando o assunto envolver pagamento ou pedido, a equipe deve solicitar o número do pedido, nunca pedir senha, token, chave privada ou dados completos de cartão.

## Atendimento

Os cargos oficiais de atendimento são `Ajudante`, `Moderador` e `Administrador`. Os cargos duplicados `Mod` e `Admin` não devem receber novas permissões até que a equipe conclua uma migração consciente dos membros. O bot PlayStorCraft permanece restrito às funções de convite e telemetria; não deve receber acesso administrativo ao conteúdo dos tickets.

A equipe deve registrar no próprio ticket a conclusão objetiva, o próximo passo esperado e, quando aplicável, o número do pedido ou a evidência técnica necessária. Problemas de entrega devem ser encaminhados para a verificação do pedido e da fila Paper, sem executar comandos manualmente no servidor para contornar a auditoria da loja.

## Fechamento

Antes de fechar, o atendente deve confirmar com o jogador que a dúvida foi resolvida ou informar por que o chamado será encerrado. Em seguida, deve usar o botão de fechamento do Ticket Tool. O canal de teste `#ticket-0001` já foi aberto e encerrado; novos tickets reais devem permanecer disponíveis apenas enquanto houver atendimento ou necessidade de auditoria.

## Arquivamento e revisão

Após o fechamento, a equipe deve manter o histórico conforme a retenção configurada pelo Ticket Tool e evitar apagar mensagens ou canais manualmente. Uma vez por semana, um administrador deve revisar tickets fechados, chamados sem resposta e permissões da categoria. O relatório interno deve registrar apenas métricas operacionais, sem copiar credenciais ou dados pessoais dos jogadores.

## FAQ para publicar no canal de abertura

> **Antes de abrir um ticket**
>
> Informe seu nick no Minecraft e explique o problema com detalhes. Para compras ou entregas, inclua o número do pedido e uma descrição do benefício esperado. Nunca envie senha, token, chave privada ou dados completos de cartão.
>
> **Qual assunto devo escolher?**
>
> O canal atende suporte do servidor, dúvidas sobre compras, entregas de VIP/Cash, problemas de acesso e orientações gerais. Denúncias devem incluir evidências e horário aproximado do ocorrido.
>
> **Quanto tempo demora?**
>
> A equipe responderá conforme a disponibilidade. Evite abrir vários tickets para o mesmo assunto, pois isso atrasa a triagem.
>
> **Como encerrar?**
>
> Quando o atendimento terminar, confirme com a equipe e use o botão de fechamento do Ticket Tool. Não apague o canal manualmente.

## Matriz de cargos duplicados

| Cargo oficial | Cargo duplicado | Regra operacional |
|---|---|---|
| `Moderador` | `Mod` | Usar `Moderador` nas novas permissões e no Ticket Tool. |
| `Administrador` | `Admin` | Usar `Administrador` nas novas permissões e no Ticket Tool. |
| `Ajudante` | Nenhum equivalente direto | Manter como cargo oficial de atendimento. |

A revisão de duplicados deve ser não destrutiva: primeiro identificar membros, permissões e bots associados; depois migrar membros individualmente, se necessário; somente então considerar arquivar ou remover cargos vazios com confirmação do proprietário.

## Referência de validação

A configuração validada inclui o painel Ticket Tool em `#🎫・abrir-ticket`, a categoria `🧰 SUPORTE (INGRESSOS)`, os cargos `Ajudante`, `Moderador` e `Administrador`, além de teste privado com criação e encerramento de `#ticket-0001`.


## Rotina semanal de acompanhamento

Uma vez por semana, um administrador deve revisar os tickets fechados e identificar chamados sem resposta ou sem atualização. A revisão deve registrar a quantidade de tickets abertos, encerrados, reabertos e pendentes, além dos assuntos recorrentes que possam exigir melhoria na loja ou no servidor.

Na mesma revisão, deve-se conferir quais membros ainda possuem os cargos duplicados `Mod` ou `Admin`. A migração para `Moderador` ou `Administrador` deve ser feita individualmente, com confirmação do membro e verificação das permissões resultantes. Até a conclusão da migração, os cargos duplicados permanecem preservados e não recebem novas permissões.

Nenhuma rotina semanal deve apagar tickets, cargos, membros ou mensagens automaticamente. Ações destrutivas exigem confirmação do proprietário e registro no canal privado de logs.

### Registro semanal sugerido

| Data | Tickets abertos | Tickets encerrados | Pendentes sem resposta | Cargos duplicados revisados | Ação necessária |
|---|---:|---:|---:|---:|---|
| ____/____/______ | ____ | ____ | ____ | ____ | ____________________ |


## Checklist mensal manual de auditoria

| Área | Verificação | Ação permitida |
|---|---|---|
| Cargos | Conferir `Admin`, `Mod`, `Administrador`, `Moderador` e cargos de bots | Manter cargos vazios; migrar membros somente após conferência individual |
| Permissões | Confirmar que suporte vê tickets e que a comunidade não vê áreas privadas | Corrigir apenas overrides comprovadamente incorretos |
| Bots | Confirmar Ticket Tool, Carl-bot, Dyno, ProBot e bot PlayStorCraft | Não remover bot ativo nem retirar permissões essenciais sem teste |
| Canais | Procurar canais vazios, duplicados ou sem finalidade | Remover apenas canal comprovadamente redundante, sem histórico ou integração |
| FAQ | Conferir regras, produtos, pagamentos, VIP/Cash e entregas | Atualizar e manter a mensagem fixada |
| Tickets | Revisar chamados sem resposta e encerrados | Fechar pelo Ticket Tool; não apagar manualmente o histórico |

A auditoria deve registrar data, responsável, itens analisados e alterações realizadas. Qualquer remoção deve ser executada somente depois de confirmar que o item está vazio, redundante e sem dependências de bots, integrações ou histórico relevante.


## Matriz de permissões e registros

| Bot | Função confirmada | Permissões a manter | Permissões a evitar |
|---|---|---|---|
| PlayStorCraft | Convite e telemetria Paper | Criar convite; enviar mensagens apenas nos canais necessários | Administrador, gerenciar cargos, banir, apagar mensagens em massa |
| Ticket Tool | Abrir e encerrar tickets | Ver canais, enviar mensagens, gerenciar canais de tickets conforme o painel | Administrador e acesso a áreas privadas sem necessidade |
| Carl-bot | Reaction roles | Ler canais, enviar mensagens e adicionar reações no `#get-roles` | Gerenciar servidor ou administrar membros |
| Dyno | Moderação existente | Manter somente as permissões realmente usadas pela configuração atual | Ampliar permissões sem auditoria |
| ProBot | Recursos existentes | Manter somente as permissões usadas no servidor | Substituir ou duplicar Ticket Tool/Carl-bot |

### Atualização segura da FAQ

Quando um produto novo for publicado, a equipe deve atualizar somente os trechos de produtos, pagamentos, VIP, Cash e entrega, usando os nomes e regras oficiais cadastrados na loja. Nunca inserir preço, benefício, comando ou prazo que não tenha sido confirmado no catálogo e no servidor Paper.

### Registro de auditoria no canal privado

Cada auditoria deve registrar a data, o responsável, os bots revisados, as permissões verificadas, os cargos ou canais analisados, as alterações executadas e a confirmação de que membros, histórico e integrações foram preservados. Remoções devem indicar o motivo e a evidência de que o item estava vazio e redundante.
