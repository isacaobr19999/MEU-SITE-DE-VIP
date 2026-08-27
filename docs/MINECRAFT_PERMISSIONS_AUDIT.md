# Auditoria de Permissões do Minecraft

> **Situação:** auditoria somente-leitura concluída em 27 de agosto de 2026. Nenhum grupo, nó, operador, configuração, jogador ou arquivo do Paper foi alterado. Este documento não contém senhas, chaves, UUIDs de jogadores ou valores de runtime.

## Escopo e conclusão executiva

A auditoria verificou o Paper ativo, o LuckPerms, os manifestos públicos dos plugins críticos e os registros de concessões por grupo. O modelo atual está baseado corretamente no LuckPerms: o `ops.json` não tem operadores e não há regras ativas em `permissions.yml`. Contudo, como o Paper está configurado com `op-permission-level=4`, qualquer OP vanilla futuro receberá privilégios máximos; a política deve continuar sendo **não usar `/op` para a equipe diária** e conceder somente nós específicos via grupos LuckPerms. O Paper documenta que esse campo define o nível padrão atribuído por `/op`. [2]

LuckPerms foi projetado para agrupar permissões e aplicar herança entre os grupos; todos os jogadores participam do grupo padrão, portanto a separação entre jogador, VIP e equipe deve ser construída por adições graduais, não por cópia de permissões entre pessoas. [1]

| Fonte de controle | Evidência observada | Conclusão |
| --- | --- | --- |
| Paper | Ativo; `online-mode=true`; `op-permission-level=4`; sem whitelist forçada | Não há risco atual por OP registrado, mas um OP criado no futuro terá acesso muito amplo. |
| `ops.json` | 0 entradas | A administração efetiva deve estar concentrada no LuckPerms. |
| `permissions.yml` | Sem regras não comentadas | Não foi encontrada uma camada Bukkit local concorrente para a matriz analisada. |
| LuckPerms 5.5.76 | Ativo, com grupos `default`, VIPs e equipe identificados | É a fonte principal de autorização a preservar e revisar. |
| RCON | Ativo, mas não é uma permissão de jogador | Deve permanecer interno, com senha protegida e sem exposição pública. |

## Grupos e permissões efetivamente observados

Os grupos identificados diretamente na auditoria foram `default`, `ferro`, `ouro`, `esmeralda`, `diamante`, `obsidian`, `ajudante`, `moderador`, `administrador`, `gerente`, `dono` e `diretor`. O administrador confirmou que esses cargos de equipe já existem no LuckPerms; portanto, **não há recomendação de criar nenhum grupo novo**. A consulta completa ao console revelou que `dono` possui o curinga global `*`; esse é o único caso de acesso total confirmado e deve permanecer estritamente reservado ao proprietário.

### Hierarquia efetivamente consultada

A consulta em console confirmou 12 grupos. O peso foi registrado apenas como referência de ordenação e metadados; a permissão efetiva segue os pais de cada grupo. [1]

| Grupo | Peso configurado | Pai direto confirmado | Leitura operacional |
| --- | ---: | --- | --- |
| `default` | 1 | Nenhum | Base de jogador comum. |
| `ferro` | 100 | Nenhum | VIP sem pai de grupo explícito. Validar no jogo se recebe todos os comandos esperados de jogador comum. |
| `ouro` | 200 | `default` | VIP com base de jogador comum. |
| `esmeralda` | 300 | `ouro` | VIP em cadeia, recebe Ouro e Default. |
| `diamante` | 400 | `esmeralda` | VIP em cadeia, recebe Esmeralda, Ouro e Default. |
| `obsidian` | 500 | `default` | VIP com base de jogador comum. |
| `ajudante` | 700 | `obsidian` | Equipe herda os benefícios de Obsidian. |
| `moderador` | 800 | `ajudante` | Equipe herda Ajudante e Obsidian. |
| `administrador` | 900 | `moderador` | Equipe herda Moderador, Ajudante e Obsidian. |
| `gerente` | 0 | `administrador` | Equipe herda toda a cadeia administrativa abaixo. |
| `dono` | 0 | `gerente` | Equipe herda toda a cadeia de Gerente e Administrador. |
| `diretor` | 1000 | Nenhum | Cargo isolado; seus nós explícitos devem ser revisados de forma independente. |

> **Achado importante:** A cadeia `ajudante → obsidian`, `moderador → ajudante` e `administrador → moderador` faz com que a equipe receba os benefícios do VIP Obsidian. Isso pode ser uma decisão comercial válida, mas não deve conceder aos VIPs o caminho inverso para a equipe. O VIP `ferro` não possui pai explícito, ao contrário dos demais VIPs; essa é uma prioridade de teste funcional.

### Nós diretos confirmados e associação de cargos sensíveis

Os nós de jogador e VIP foram revisados diretamente no console. `default` possui somente comandos e recursos de sobrevivência, chat e economia comum; `ferro`, `ouro`, `esmeralda`, `diamante` e `obsidian` possuem kits e benefícios próprios. Para a amostra inferior e superior de VIPs (`ferro` e `obsidian`), as verificações de `minecraft.command.op`, `luckperms.*`, `playeconomy.admin.cash`, `discordbooster.admin.grant`, `coreprotect.restore` e `worldguard.region.define` retornaram `undefined`, isto é, não concedidas nem herdadas. Esse resultado confirma a fronteira administrativa para os VIPs testados. [1]

| Grupo | Nós diretos confirmados relevantes | Membros diretos ou herdeiros consultados | Avaliação |
| --- | --- | --- | --- |
| `default` | comandos Essentials de uso próprio, proteção de terrenos, chat, leilão e economia comum | Base padrão | Não há nó administrativo crítico listado diretamente. |
| `ferro` | `essentials.kit.ferro`, `shop.kit.premium` | Não consultado individualmente | VIP limitado; não herda grupo adicional. |
| `ouro` | `essentials.kit.ouro`, `shop.kit.premium` | Não consultado individualmente | Herda `default`. |
| `esmeralda` | `essentials.kit.esmeralda`, `shop.kit.premium` | Não consultado individualmente | Herda Ouro e Default. |
| `diamante` | `essentials.kit.diamante`, `essentials.hat`, `shop.kit.premium` | Não consultado individualmente | Herda Esmeralda, Ouro e Default. |
| `obsidian` | `essentials.kit.obsidian`, `essentials.enderchest`, `shop.kit.premium` | Herdado pela cadeia de equipe | VIP limitado, porém é a base herdada pela equipe. |
| `ajudante` | `essentials.help`, `essentials.mute` | 0 usuários diretos; herdado por Moderador | Acesso de apoio e moderação básica. |
| `moderador` | `essentials.kick`, `essentials.mute`, `playanuncios.stats`, `playchat.admin.mute` | 0 usuários diretos; herdado por Administrador | Moderação delimitada, sem economia, mundo ou LuckPerms confirmado. |
| `administrador` | banimento, inventário de consulta, restauração CoreProtect, região WorldGuard e gestão de Booster | 0 usuários diretos; herdado por Gerente | Alto privilégio operacional, mas sem curinga próprio confirmado. |
| `gerente` | `essentials.teleport`, `essentials.unban` | 0 usuários diretos; herdado por Dono | Recebe toda a cadeia administrativa. |
| `dono` | `*` | 1 usuário direto, não identificado neste documento | **Acesso total.** Deve ficar em uma única conta protegida e nunca ser vendido, atribuído a VIP ou usado para operação diária. |
| `diretor` | Booster administrativo, backup de anúncios, bypass de filtro, SocialSpy, Cash administrativo e reload de loja | 0 usuários diretos | Alto privilégio isolado; nenhuma herança direta confirmada. |

| Perfil | Nós observados ou padrão declarado | Leitura de privilégio |
| --- | --- | --- |
| Jogador normal (`default`) | `/spawn`, `/home`, `/sethome`, `/tpa`, `/tpaccept`, `/warp`, `/msg`, chat local, ignorar jogador, leilão, gui de anúncios e funções econômicas padrão | Acesso comum de sobrevivência e economia. Não foram observados nós administrativos do LuckPerms, WorldEdit, WorldGuard, CoreProtect ou Booster administrativo. |
| VIP Ferro | `shop.kit.premium` | Benefício comercial limitado. Mantém as permissões de jogador padrão. |
| VIP Ouro | `shop.kit.premium` | Mesmo patamar de permissão observado que Ferro; a diferença comercial deve estar em kit, item, duração ou preço, não em administração. |
| VIP Diamante | `shop.kit.premium`, `essentials.hat` | Acrescenta apenas benefício cosmético/qualidade de vida. |
| VIP Esmeralda | `shop.kit.premium` | Benefício comercial limitado. |
| VIP Obsidian | `shop.kit.premium`, `essentials.enderchest` | Acrescenta acesso pessoal ao próprio ender chest; não concede gestão de outros jogadores. |
| Moderador existente | Existência confirmada pelo administrador; nós efetivos não foram retornados pela consulta somente-leitura | Deve manter apenas moderação de chat e atendimento, sem economia, restauração, gestão de mundo ou permissões LuckPerms. |
| Administrador | restauração CoreProtect, definição WorldGuard, concessão/revogação/consulta/sincronização/reload de Booster, configuração de TAB/loja e administração imobiliária | Alto privilégio operacional. Pode alterar regiões, recuperar blocos e administrar benefícios Booster; deve ser restrito a equipe muito confiável. |
| Diretor | administração de Cash, backup de anúncios, SocialSpy, bypass de filtro do chat, reload de loja e administração de Booster | Perfil mais sensível para economia e privacidade. Deve ser exclusivo do proprietário ou de responsável operacional formalmente definido. |

## Matriz recomendada

A matriz a seguir não foi aplicada. Ela separa **benefício de jogador** de **poder de gestão**, evitando que uma compra VIP dê acesso a dados, economia ou moderação.

| Permissão ou família | Jogador | VIP | Moderador existente | Administrador | Diretor/Proprietário | Observação |
| --- | --- | --- | --- | --- | --- | --- |
| `playeconomy.*` de uso normal | Permitido conforme o plugin | Herdado | Herdado | Herdado | Herdado | Os nós padrão do PlayEconomy são de jogador; manter limites econômicos no próprio plugin. |
| `playeconomy.admin.*` | Negar | Negar | Negar | Apenas nós necessários | Permitido por função | `playeconomy.admin.cash` deve ficar somente na função financeira responsável. |
| `discordbooster.admin.*` | Negar | Negar | Negar | Permitido se atende benefícios | Permitido | O vínculo de conta não exige administração. |
| `minecraftdiscord.account` | Permitido | Permitido | Permitido | Permitido | Permitido | Nó padrão para vínculo Site–Discord–Minecraft. |
| `minecraftdiscord.admin` | Negar | Negar | Negar | Permitido conforme necessidade | Permitido | Não conceder junto a VIP. |
| `playchat.admin.*` | Negar | Negar | Warn/mute/unmute/warnings | Permitido | Permitido | Não conceder `debug`, bypasses ou SocialSpy ao moderador por padrão. |
| `playchat.private.socialspy` | Negar | Negar | Negar por padrão | Apenas se justificado | Permitido excepcionalmente | Acesso a mensagens privadas exige regra interna de privacidade e auditoria. |
| `playchat.bypass.*` | Negar | Negar | Negar | Apenas em incidentes | Permitido excepcionalmente | Bypass de filtro, mute ou lock não deve ser um benefício permanente comum. |
| `worldedit.*`, `worldguard.*` | Negar | Negar | Negar | Nós mínimos por tarefa | Permitido por função | Evitar curingas; conceder construção/região somente a quem administra mapa. |
| `coreprotect.restore` | Negar | Negar | Negar | Apenas equipe de restauração | Permitido por função | A restauração pode desfazer construções; toda ação deve ser registrada. |
| `luckperms.*` e `minecraft.command.op` | Negar | Negar | Negar | Negar em jogo por padrão | Console ou `dono` estritamente protegido | O controle de permissões não deve ser distribuído por conveniência. |
| Vanilla/Paper administrativo | Negar | Negar | Apenas o estritamente necessário | Apenas o estritamente necessário | Preferir console | Paper lista ban, op, reload, stop, give e comandos de mundo como não concedidos por padrão. [3] |

## Pontos positivos confirmados

O desenho comercial observado já mantém os VIPs separados de nós administrativos. Ferro, Ouro e Esmeralda receberam somente o kit premium; Diamante acrescenta `essentials.hat`; Obsidian acrescenta `essentials.enderchest`. Não foi encontrado, na matriz observada, nenhum nó de economia administrativa, Booster administrativo, WorldEdit, WorldGuard, CoreProtect ou LuckPerms associado a esses VIPs.

O perfil padrão possui comandos comuns de sobrevivência, chat e economia. Isso é compatível com o objetivo de permitir jogo normal sem expor ferramentas de administração. O PlayEconomy declara seus nós de uso geral como disponíveis por padrão, enquanto `playeconomy.admin` e seus subcomandos sensíveis são destinados a OPs. A configuração atual reforça parte dessa separação com concessões explícitas para equipe.

## Riscos e ações recomendadas

| Prioridade | Risco ou lacuna | Ação recomendada | Alteração aplicada nesta auditoria |
| --- | --- | --- | --- |
| Alta | `op-permission-level=4` concede privilégios máximos a qualquer OP futuro | Manter `ops.json` vazio; usar grupos LuckPerms para equipe e console somente para recuperação. | Não aplicada. |
| Alta | `dono` possui `*` e há 1 membro direto | Manter somente a conta do proprietário neste grupo, protegida por conta Microsoft e senha exclusiva; não usar para tarefas de moderação cotidiana. | Não aplicada. |
| Alta | Diretor possui `playeconomy.admin.cash`, SocialSpy e bypass de filtro | Limitar o grupo a responsáveis nomeados, revisar mensalmente membros e registrar o uso de nós sensíveis. | Não aplicada. |
| Alta | Administrador possui `coreprotect.restore` e `worldguard.region.define` | Revisar o cargo de moderação já existente para garantir que ele não herde construção ou restauração; manter esses nós somente em cargos existentes de administração/mundo. | Não aplicada. |
| Média | `playchat.format.color` está concedido ao `default`, apesar de o manifesto declarar padrão de OP | Confirmar se cores no chat são um benefício intencional. Se não forem, remover somente esse nó do grupo padrão após backup e homologação. | Não aplicada. |
| Média | `customenchants.enchant` está presente no `default` | Verificar se o nó permite apenas encantamentos previstos pelo gameplay. Se ele permitir criar itens fora da economia, restringi-lo a uma função específica. | Não aplicada. |
| Média | A cadeia de equipe herda `obsidian` e o VIP `ferro` não possui pai explícito | Confirmar em contas de teste que Ferro recebe somente os comandos de jogador esperados e que Ajudante/Moderador/Admin recebem benefícios VIP apenas se isso for desejado. | Não aplicada. |
| Média | Diretor não possui pai explícito | Revisar os nós próprios desse cargo para garantir que ele tenha apenas os acessos necessários e continue separado da cadeia geral. | Não aplicada. |

## Verificação segura antes de qualquer mudança

Os seguintes comandos são de consulta e não editam permissões. Execute-os pelo console Paper ou por uma conta que já tenha autorização LuckPerms; não publique links de editor, UUIDs, senhas ou saídas que identifiquem jogadores.

```text
/lp group default permission info
/lp group ferro permission info
/lp group ouro permission info
/lp group diamante permission info
/lp group esmeralda permission info
/lp group obsidian permission info
/lp group administrador permission info
/lp group diretor permission info
/lp group ajudante parent info
/lp group moderador parent info
/lp group gerente parent info
/lp group dono parent info

/lp group <grupo> parent info
/lp user <jogador-de-teste> permission check <no-de-permissao>
```

Para confirmar qual nó um comando realmente exige, LuckPerms recomenda registrar temporariamente verificações com `/lp verbose record <jogador-de-teste>`, testar o comando com esse jogador e finalizar com `/lp verbose paste`. [1] Esse processo deve ser feito com conta de teste e nunca deve conceder, alterar ou remover permissões durante a coleta.

## Limites desta auditoria

Esta análise confirma plugins, políticas Paper, grupos, pesos, heranças, nós diretos e contagens de associação dos cargos sensíveis por meio do console LuckPerms. Para preservar a privacidade, nenhum nome de membro foi incluído neste documento. A validação de `permission check` confirmou a ausência dos nós administrativos críticos nas amostras VIP Ferro e VIP Obsidian; o teste completo de comandos dentro do cliente Minecraft continua sendo uma etapa opcional, pois exige contas conectadas. Esta auditoria não altera economia, VIPs, mundos, integrações da loja, RCON ou o painel web.

## Referências

[1]: https://luckperms.net/wiki/Usage "LuckPerms — Usage"
[2]: https://docs.papermc.io/paper/reference/server-properties/ "Paper — server.properties"
[3]: https://docs.papermc.io/paper/reference/permissions/ "Paper — Permissions"
