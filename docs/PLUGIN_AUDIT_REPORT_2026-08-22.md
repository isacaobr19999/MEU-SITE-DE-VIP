# Auditoria mecânica dos plugins Minecraft

## Escopo

A auditoria foi baseada nos dois módulos-fonte presentes no projeto, nos JARs realmente instalados na VPS, na compilação local e nos logs do servidor Paper. Não foi afirmado que comandos, stress ou integrações funcionam apenas por inspeção estática; onde não houve execução real, o resultado permanece **não executado**.

## Resultado executivo

A causa principal encontrada foi uma **identificação incorreta do JAR**: `PlayStorCraft-Site.jar` não é o plugin `PlayStorCraft` do módulo `minecraft-plugin`; o JAR instalado contém `MinecraftDiscordPlatform` v0.1.0. O plugin `PlayStorCraftStatus` carregava, mas estava com telemetria desativada porque sua configuração usava o placeholder `ALTERE_ESTA_CHAVE`. A configuração foi corrigida na VPS, o Paper foi reiniciado, o endpoint aceitou a telemetria com HTTP 200 e o monitor passou a registrar `minecraft ONLINE`.

| Área | Resultado | Evidência | Gravidade |
|---|---|---|---|
| Compilação do plugin de entregas | OK | Wrapper Gradle 8.7 criado; `clean build` concluído | 🟢 OK |
| Compilação do plugin de status | OK | `./gradlew build` concluído com Java 21 | 🟢 OK |
| Identificação dos JARs | Corrigida | JAR ativo identificado como `MinecraftDiscordPlatform` v0.1.0 | 🟠 Alto |
| Inicialização Paper | OK após correção | Paper iniciou; `PlayStorCraftStatus` ativou telemetria | 🟢 OK |
| Telemetria Paper → loja | OK | POST autenticado aceitou HTTP 200; monitor registrou Paper online | 🟢 OK |
| Entregas PlayStorCraft | Não executado nesta auditoria | O JAR-fonte de entregas não foi substituído no servidor | 🔵 Não executado |
| Comandos e permissões | Parcial | Metadados do módulo de entregas revisados; execução de cada comando não foi feita | 🔵 Não executado |
| LuckPerms | Parcial | Dependência opcional verificada no código e plugin carregado no Paper | 🟡 Médio |
| Banco de dados do plugin | Não executado | Não há teste mecânico completo do banco do plugin nesta rodada | 🔵 Não executado |
| Desempenho e stress | Não executado | Não foi gerada carga artificial em servidor de produção | 🔵 Não executado |
| Segurança | Parcial | Chave não foi exposta no repositório; rota aceitou autenticação real | 🟡 Médio |

## Correções aplicadas

A configuração de `plugins/PlayStorCraftStatus/config.yml` na VPS passou a usar a URL oficial `https://playstorcraft.com.br` e a chave já existente do plugin de entregas, sem copiar o segredo para o código ou para o GitHub. O servidor Paper foi reiniciado pelo contêiner correto, sem substituir o plugin Discord ativo.

Também foi criado o Gradle Wrapper 8.7 em `minecraft-plugin/`, pois o Gradle global disponível era 4.4.1 e não reconhecia corretamente o build Kotlin DSL. Com o Wrapper, o plugin de entregas compilou com sucesso.

## Limitações restantes

Ainda é necessário decidir se o `MinecraftDiscordPlatform` instalado deve permanecer como integração oficial ou ser substituído pelo módulo `minecraft-plugin`. Essa troca não deve ser automática. Antes dela, é necessário executar uma janela de homologação com backup do JAR ativo, teste dos comandos `/discord`, permissões, vinculação de conta, entregas pendentes e integração com o bot.

A telemetria agora está operacional, mas o status real depende de o Paper continuar ativo e publicar dentro do TTL de três minutos. O agente da VPS verifica a loja, API, Discord e Paper a cada cinco minutos.

## Comandos reproduzíveis

```bash
cd minecraft-plugin
./gradlew --no-daemon --console=plain clean build

cd ../minecraft-status-plugin
./gradlew --no-daemon --console=plain clean build
```

A auditoria não incluiu pagamento, entrega real de produto ou stress em produção. Esses testes devem ocorrer em servidor de validação, com produtos de teste e sem concluir cobrança real.

## Auditoria adicional do MinecraftDiscordPlatform ativo

O JAR copiado da VPS possui SHA-256 `c36c10f2f22fcf77fe783d9732d16ee621e771bba2e3e3649c1fcbd3ca3a82cb` e declara `MinecraftDiscordPlatform` v0.1.0, com comando `/discord <link|unlink>`, permissão `minecraftdiscord.account` e integração opcional com LuckPerms, Vault, PlaceholderAPI e Essentials. O bytecode usa `http://localhost:3000` como valor padrão, a configuração ativa possui `integration-api-key` vazio e o cliente espera `x-integration-key` nos endpoints `/api/integration/events`, `/api/integration/link-codes` e `/api/integration/admin/commands/result`.

A API atual do projeto expõe rotas diferentes: `/api/integrations/discord/status`, protegida por `x-playstor-discord-secret`, e `/api/minecraft/status`, protegida por `x-playstor-server-key`. Testes POST públicos aos endpoints legacy retornaram o fallback HTML da SPA, enquanto as rotas atuais sem credencial retornaram HTTP 401. Isso confirma uma **incompatibilidade de contrato**, não um erro de permissão que deva ser resolvido adivinhando uma chave.

Por segurança, o JAR ativo não foi substituído, desativado nem recebeu a chave do bot. A correção definitiva exige uma destas decisões: disponibilizar o código-fonte e o contrato do MinecraftDiscordPlatform para adaptação; migrar suas funções para as rotas atuais mantendo `/discord`; ou manter o JAR apenas como legado e usar `PlayStorCraftStatus` mais o bot atual. A primeira e a segunda opções devem ser homologadas fora da produção antes de trocar o arquivo ativo.

## Adaptação legacy implementada

O backend passou a oferecer compatibilidade controlada para o contrato usado pelo JAR ativo: `GET /api/integration/health`, `POST /api/integration/events`, `POST /api/integration/link-codes`, `POST /api/integration/link-codes/redeem-discord` e `POST /api/integration/link-codes/revoke`. Os eventos são autenticados por `x-integration-key`, registrados com idempotência e traduzem `server.heartbeat` para o status público do Paper. Mensagens de chat não são persistidas em texto; apenas metadados mínimos podem ser registrados.

Foram criadas as tabelas `integration_events`, `discord_accounts`, `minecraft_link_codes` e `player_discord_links` por migrações não destrutivas. A chave `INTEGRATION_API_KEY` foi adicionada ao Compose e ao runtime protegido; nenhum valor foi incluído no repositório. O app respondeu `{"ok":true,"service":"minecraft-discord-platform"}` com autenticação válida, e os logs do Paper confirmaram `Minecraft Discord Platform enabled for server primary` sem novos `401` após a migração do banco.

A correção foi publicada na VPS sem substituir o JAR ativo. Os testes locais finais passaram: **47 arquivos e 129 testes**, TypeScript sem erros. A homologação real de `/discord link`, `/discord unlink`, resgate por usuário Discord, comandos administrativos e entrega de produto continua necessária antes de declarar esses fluxos como aprovados em produção.
