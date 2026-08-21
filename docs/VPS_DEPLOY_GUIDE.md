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
