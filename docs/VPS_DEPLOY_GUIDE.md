# Guia de atualização segura da VPS

Este procedimento atualiza somente o código versionado da PlayStorCraft na VPS e preserva o arquivo de runtime, o banco MySQL, os volumes do Paper e os tokens do Discord. Execute os comandos em uma máquina administrativa que possua acesso SSH autorizado. **Não copie nem versione** `/root/playstorcraft-runtime`, chaves privadas, arquivos `.env`, backups de banco ou o volume do Paper.

> O serviço de aplicação é executado por Docker Compose no diretório `/opt/playstorcraft`. O runtime protegido permanece fora do repositório, com permissões restritas, e é referenciado pelo Compose durante a recriação dos contêineres.

## Antes da atualização

Confirme que o código local está aprovado e que o repositório remoto contém o mesmo commit. O teste completo e a checagem de tipos devem terminar sem erro antes de qualquer sincronização.

| Verificação | Comando | Resultado esperado |
| --- | --- | --- |
| Testes | `pnpm vitest run --pool=threads --minWorkers=1 --maxWorkers=1` | Todas as suítes aprovadas. |
| Tipagem | `pnpm exec tsc --noEmit` | Sem erros de TypeScript. |
| Alterações locais | `git status --short` | Apenas arquivos que se pretende publicar. |
| Histórico remoto | `git log --oneline -1` | Commit que será implantado identificado. |

## Atualização de rotina

No computador administrativo, execute os comandos abaixo a partir de `/home/ubuntu/playstorcraft`. Eles enviam o código sem `.git`, dependências locais, artefatos de build e logs de desenvolvimento. A chave é usada apenas pela sessão SSH e não deve ser copiada para a VPS.

```bash
cd /home/ubuntu/playstorcraft

KEY=/home/ubuntu/.ssh/playstorcraft_vps_deploy
HOST=root@169.58.176.169

tar -C /home/ubuntu/playstorcraft \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.manus-logs' \
  -czf - . | ssh -i "$KEY" "$HOST" "tar -xzf - -C /opt/playstorcraft"

ssh -i "$KEY" "$HOST" \
  "cd /opt/playstorcraft && \
  docker compose --project-name vps \
    --env-file /root/playstorcraft-runtime \
    -f deployment/vps/docker-compose.yml \
    up -d --build --force-recreate app"
```

Nesta atualização de vitrine, somente o serviço `app` precisa ser recriado. Inclua `discord-bot` no comando apenas quando houver alteração no diretório `discord-bot/` ou em sua configuração. Não use `docker compose down -v`, pois essa operação pode remover volumes necessários ao banco ou a serviços persistentes.

## Validação após atualizar

Faça as verificações abaixo antes de anunciar a nova versão. Elas não criam pedidos, pagamentos ou entregas.

```bash
KEY=/home/ubuntu/.ssh/playstorcraft_vps_deploy
HOST=root@169.58.176.169

ssh -i "$KEY" "$HOST" \
  "cd /opt/playstorcraft && \
  docker compose --project-name vps \
    --env-file /root/playstorcraft-runtime \
    -f deployment/vps/docker-compose.yml ps"

curl -fsSI https://playstorcraft.com.br/
curl -fsSI https://playstorcraft.com.br/status
```

Abra a página inicial em desktop e celular. Quando houver uma campanha que cumpra todas as regras, o cartão deve indicar código, desconto e validade; em cupons vencidos, inativos, esgotados ou sem produto aplicável, o cartão não deve aparecer. Confirme também um VIP e a tela de detalhe para verificar a apresentação de grupo e duração. A confirmação de pagamento, a regra de desconto e a entrega automática continuam sendo validadas somente no servidor durante o checkout.

### Evidência desta atualização

Em 21 de agosto de 2026, a versão publicada foi verificada no domínio `playstorcraft.com.br` após a recriação do serviço `app`. A página retornou HTTP 200, exibiu os 11 produtos ativos e apresentou a campanha **BEMVINDO10** com **10% de desconto** e validade até **31/08/2026 às 23:59**. A tabela de VIPs também mostrou somente o grupo e a duração já cadastrados, sem benefícios adicionais. Antes da implantação, a suíte Vitest aprovou 126 testes, a verificação TypeScript não encontrou erros e o build de produção foi concluído.

## Diagnóstico e recuperação

Se a página não responder, consulte primeiro o estado e os últimos logs do serviço, sem expor o arquivo de runtime:

```bash
ssh -i "$KEY" "$HOST" \
  "cd /opt/playstorcraft && \
  docker compose --project-name vps \
    --env-file /root/playstorcraft-runtime \
    -f deployment/vps/docker-compose.yml logs --tail=150 app"
```

Para recuperar uma versão anterior, retorne o repositório local a um **commit conhecido e aprovado**, repita a sincronização de arquivos e recrie o serviço `app`. Não altere o banco como parte de um rollback de interface, pois os dados comerciais e de pedidos são persistentes. Antes de qualquer migração de schema, faça backup validado do banco e aplique a mudança em ordem controlada.

## Relação com os serviços externos

O domínio HTTPS, os segredos do Mercado Pago, a assinatura de webhook, as chaves do Paper e o token do bot Discord permanecem no runtime protegido. A aplicação deve continuar usando `APP_BASE_URL=https://playstorcraft.com.br`, e o endpoint de pagamentos deve permanecer configurado como `https://playstorcraft.com.br/api/webhooks/mercadopago`. Para detalhes de credenciais, webhook, manutenção e diagnóstico de entregas, consulte também [deployment.md](./deployment.md). As notificações de pagamento devem ser autenticadas por assinatura e confirmadas consultando o recurso de pagamento no servidor, conforme a documentação do Mercado Pago. [1] [2]

## Referências

[1] [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

[2] [Mercado Pago — Notificações de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)

A ficha pública de `VIP Ferro` também foi verificada em 21 de agosto de 2026: exibiu o grupo `VIP Ferro`, duração de 30 dias, preço de R$ 9,90 e destino `PlayStorCraft`, sem comandos ou benefícios inventados. Nenhum item foi adicionado ao carrinho durante essa verificação.

## Atualização do bot e vínculo Discord–Minecraft

Quando houver alteração em `discord-bot/index.mjs`, recrie também o serviço do bot para que os comandos slash sejam registrados:

```bash
docker compose --env-file /root/playstorcraft-runtime -f /opt/playstorcraft/deployment/vps/docker-compose.yml up -d --build --force-recreate discord-bot

docker compose --env-file /root/playstorcraft-runtime -f /opt/playstorcraft/deployment/vps/docker-compose.yml logs --tail=80 discord-bot
```

O bot precisa receber `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`, `DISCORD_BOT_BRIDGE_SECRET` e `INTEGRATION_API_KEY` somente pelo runtime protegido. A URL interna pode ser ajustada por `PLAYSTORCRAFT_BACKEND_URL`; quando o Compose usa o serviço `app`, o padrão é `http://app:3000`.

O fluxo de homologação é: no Paper, o jogador executa `/discord link`; em seguida, no Discord, usa `/link`, clica em **Informar código** e envia o código de seis dígitos. O bot chama `/api/integration/link-codes/redeem-discord`, que valida expiração, uso único, jogador existente e vínculo ativo. Para testar a remoção, o jogador usa `/unlink` no Discord; a API marca o vínculo como inativo em `player_discord_links` e preserva o histórico. Não registre códigos, tokens ou chaves nos logs, tickets ou commits.

A validação mínima deve confirmar os logs de registro dos comandos, a resposta de sucesso ou erro explícito no Discord, a criação ou atualização do vínculo no banco e a rejeição de código expirado, já utilizado ou inválido. Essa homologação não deve criar pedidos, pagamentos ou entregas reais.

> O endpoint legacy exige o cabeçalho `x-integration-key`. Uma resposta HTTP 401 indica chave ausente, incorreta ou não propagada para o contêiner; não substitua a chave por valores no código-fonte.

## Rotação da server-api-key de um servidor existente

A chave pode ser renovada pelo painel sem recriar a loja e sem alterar produtos, pedidos ou vínculos. Acesse **Catálogo → Servidores → PlayStorCraft → Editar** e clique em **Gerar nova chave**. Confirme a operação e copie a chave exibida imediatamente; por segurança, ela é mostrada somente nessa operação.

A rotação invalida a chave anterior. Atualize somente o campo correspondente no Paper:

```yaml
server-api-key: "NOVA_CHAVE_GERADA_NO_PAINEL"
```

O arquivo normalmente fica em `plugins/PlayStorCraft/config.yml`. Preserve os demais campos, não publique a chave em repositórios ou mensagens e reinicie o Paper depois de salvar. Valide nos logs do plugin que a conexão com a API foi autenticada e confirme que o monitoramento voltou a reportar o servidor como online.

Se o botão não aparecer, atualize o serviço `app` com o código mais recente antes de tentar a rotação. A variável `MINECRAFT_API_KEY_PEPPER` deve existir no runtime protegido; nunca coloque seu valor no código ou na documentação.

## Rollback do bot

Se o bot não iniciar após uma atualização, preserve os logs e restaure o último checkpoint pelo painel de gerenciamento ou pelo procedimento de rollback versionado. Não utilize `docker compose down -v`, pois volumes do MySQL e dados do Paper não devem ser removidos.

> Estado desta documentação em 22 de agosto de 2026: o fluxo de código, resgate e desvinculação está coberto por testes automatizados. A homologação com um jogador real no servidor Paper e a publicação da nova imagem do bot ainda devem ser executadas pelo operador da VPS.

## Variáveis adicionais do bot

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `DISCORD_APPLICATION_ID` | Para registrar slash commands | ID da aplicação Discord que possui o bot. |
| `PLAYSTORCRAFT_BACKEND_URL` | Não | URL interna ou HTTPS da API; padrão `http://app:3000`. |
| `INTEGRATION_API_KEY` | Sim | Chave compartilhada com o plugin legacy e o bot, fornecida apenas pelo runtime. |
| `DISCORD_BOT_BRIDGE_SECRET` | Sim | Segredo das rotas operacionais atuais do bot. |
| `DISCORD_GUILD_ID` | Recomendável | Faz o registro imediato dos comandos no servidor configurado. |
| `DISCORD_BOT_TOKEN` | Sim | Token privado usado somente pelo serviço do bot. |

Nunca cole valores dessas variáveis em issues, mensagens, commits ou arquivos versionados.
