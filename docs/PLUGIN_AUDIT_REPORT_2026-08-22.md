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
