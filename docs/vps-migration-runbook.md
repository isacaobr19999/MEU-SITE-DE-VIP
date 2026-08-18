# Guia completo: instalação e migração da PlayStorCraft para outra VPS

**Versão:** 1.0
**Público:** responsável técnico da PlayStorCraft
**Objetivo:** instalar a loja em uma nova VPS ou migrar a produção com banco, assets, bot Discord e integração Paper, preservando segredos fora do Git.

> **Regra de segurança:** não envie por chat, commit, captura de tela ou repositório os conteúdos de `/root/playstorcraft-runtime`, tokens Mercado Pago, token Discord, certificados, chaves do Paper ou backups sem criptografia. Se algum desses dados for exposto, gere e aplique uma rotação.

## 1. Arquitetura que será restaurada

| Serviço | Onde executa | Dados que precisam persistir | Observação de migração |
| --- | --- | --- | --- |
| `app` | Container Docker | MySQL e arquivo de runtime | Expõe somente `127.0.0.1:3000`. |
| `mysql` | Container Docker | Volume MySQL e dump lógico | Não expor a porta 3306 à internet. |
| `discord-bot` | Container Docker | Volume `discord_bot_data` | Apenas uma instância do bot deve ficar conectada por vez. |
| Nginx + Certbot | Host Ubuntu | Arquivo de site e certificados | Recebe HTTPS e encaminha para a aplicação. |
| Paper | Pterodactyl ou host próprio | Mundo, plugins, `server.properties` e configuração do plugin | A chave do servidor precisa ser recriada/rotacionada depois da migração. |

O Compose usa Node 22 e MySQL 8.4 com `utf8mb4`; a aplicação recebe a URL pública e segredos apenas no runtime privado. [1] [2]

## 2. Pré-requisitos da nova VPS

Use Ubuntu 24.04 LTS atualizado, acesso `root` ou `sudo`, IP público fixo e portas **22**, **80** e **443** liberadas. Para hospedar o Paper na mesma máquina, também preserve as portas do Minecraft já utilizadas pelo servidor. O domínio deve poder ter seus registros A/AAAA alterados.

Antes do corte, reduza o TTL DNS para 300 segundos e confirme que o novo servidor responderá pelo domínio. Tenha uma janela de manutenção: a transferência final exige parar a aplicação e o bot antigos para evitar divergência de pedidos ou mensagens duplicadas.

### Pacotes de base

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx ufw rsync
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

Instale Docker Engine e o plugin Docker Compose conforme o procedimento oficial da distribuição. Em seguida, confirme `docker --version` e `docker compose version`. [3]

## 3. Obter o código e criar o runtime privado

```bash
mkdir -p /opt
cd /opt
gh repo clone isacaobr19999/MEU-SITE-DE-VIP playstorcraft
cd /opt/playstorcraft

install -m 600 /dev/null /root/playstorcraft-runtime
cp deployment/vps/runtime.template /root/playstorcraft-runtime
chmod 600 /root/playstorcraft-runtime
nano /root/playstorcraft-runtime
```

Preencha cada valor real no runtime. Gere valores aleatórios longos para senhas MySQL, `JWT_SECRET`, `MINECRAFT_API_KEY_PEPPER`, `MAINTENANCE_SECRET` e `DISCORD_BOT_BRIDGE_SECRET`; por exemplo, `openssl rand -hex 32`. Mantenha `APP_BASE_URL` no domínio HTTPS definitivo, sem barra final.

| Grupo | Variáveis que precisam ser preenchidas |
| --- | --- |
| Banco e sessão | `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` |
| Operação da loja | `APP_BASE_URL`, `MINECRAFT_API_KEY_PEPPER`, `MAINTENANCE_SECRET` |
| Pagamento | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_WEBHOOK_SECRET` |
| Discord | `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_BOT_BRIDGE_SECRET`, IDs de canais e convite |

Não inicie o bot Discord até a migração finalizar. Duas cópias conectadas simultaneamente podem publicar status duplicado ou disputar o convite persistido.

## 4. Backup consistente da VPS antiga

Na VPS atual, entre pelo SSH, pare somente os escritores e execute o script de backup. O MySQL continua disponível durante o dump, mas a parada da aplicação e do bot reduz alterações no intervalo de corte.

```bash
cd /opt/playstorcraft
set -a; . /root/playstorcraft-runtime; set +a
docker compose --env-file /root/playstorcraft-runtime -f deployment/vps/docker-compose.yml stop app discord-bot

PAPER_SERVER_PATH=/var/lib/pterodactyl/volumes/UUID_DO_PAPER \
  bash deployment/vps/backup-playstorcraft.sh
```

O diretório retornado contém dump MySQL comprimido, assets, estado persistido do bot, runtime privado, manifesto e hashes. O backup do Paper é opcional no script porque algumas instalações o administram pelo Pterodactyl; quando possível, use também o backup oficial do painel para mundos e arquivos do servidor.

Empacote e transfira o diretório por canal protegido. Uma opção é `rsync -aP --chmod=Du=rwx,Dgo=,Fu=rw,Fgo= /root/playstorcraft-backups/ USUARIO@NOVA_VPS:/root/playstorcraft-backups/`. Guarde outra cópia offline ou em armazenamento criptografado. **Não exclua a VPS antiga antes da validação completa.**

## 5. Restaurar banco, assets e bot na nova VPS

Primeiro inicie apenas o MySQL, restaure o dump e depois suba os demais serviços.

```bash
cd /opt/playstorcraft
docker compose --env-file /root/playstorcraft-runtime -f deployment/vps/docker-compose.yml up -d mysql

gzip -dc /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ/mysql.sql.gz \
  | docker compose --env-file /root/playstorcraft-runtime -f deployment/vps/docker-compose.yml exec -T mysql \
    sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Restaure os assets em `/srv/playstorcraft-assets` e preserve proprietário/permissões de leitura para o Nginx. Se houver backup do estado do bot, restaure-o **antes** de iniciar `discord-bot` e confirme o nome real do volume com `docker volume ls`.

```bash
install -d -m 755 /srv/playstorcraft-assets
tar -C /srv/playstorcraft-assets -xzf /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ/store-assets.tar.gz

docker volume create vps_discord_bot_data
docker run --rm -v vps_discord_bot_data:/target -v /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ:/backup:ro alpine:3.20 \
  sh -c 'tar -C /target -xzf /backup/discord-bot-data.tar.gz'
```

## 6. Configurar Nginx, DNS e HTTPS

Copie a configuração versionada, valide-a e emita o certificado somente depois de o DNS apontar para a nova VPS.

```bash
cp deployment/vps/nginx-playstorcraft.conf /etc/nginx/sites-available/playstorcraft
ln -s /etc/nginx/sites-available/playstorcraft /etc/nginx/sites-enabled/playstorcraft
nginx -t && systemctl reload nginx

# Depois de apontar playstorcraft.com.br e www para o novo IP:
certbot --nginx -d playstorcraft.com.br -d www.playstorcraft.com.br
```

Em seguida, aplique os cabeçalhos de produção e valide o Nginx. O script guarda backup fora de `sites-enabled` para não criar conflito de configuração.

```bash
scp deployment/vps/apply-security-headers.sh root@NOVA_VPS:/root/
ssh root@NOVA_VPS 'chmod 700 /root/apply-security-headers.sh && /root/apply-security-headers.sh'
```

As rotas dinâmicas devem retornar `Cache-Control: no-store`; os assets de loja podem manter cache longo e imutável. HSTS só deve ser ativado depois do HTTPS confirmado.

## 7. Iniciar aplicação, bot e validações

```bash
cd /opt/playstorcraft
docker compose --env-file /root/playstorcraft-runtime -f deployment/vps/docker-compose.yml up -d --build
bash deployment/vps/verify-playstorcraft.sh
```

Verifique manualmente `/`, `/rules`, `/news`, `/status`, login, catálogo, carrinho e `/admin` com uma conta administrativa. No Mercado Pago, confirme que o webhook de **Pagamentos** aponta para `https://SEU-DOMINIO/api/webhooks/mercadopago`; a confirmação do gateway, e não o retorno do navegador, é que libera uma entrega. [4] [5]

## 8. Reinstalar ou migrar o Paper

Copie o JAR PlayStorCraft e suas dependências para `plugins/`, preserve LuckPerms e os plugins de economia/Booster já homologados e reinicie o Paper. Configure a URL HTTPS da nova loja em `plugins/PlayStorCraft/config.yml`.

> Não reaproveite uma chave de servidor eventualmente exposta em backup ou mensagem. Crie/rotacione uma nova chave no painel administrativo da loja e altere o `config.yml` privado do Paper. A loja guarda apenas o hash da chave e as entregas exigem um claim válido antes de executar comandos. [6] [7]

Ao mudar de máquina, transfira mundos, plugins e `server.properties` por backup do Pterodactyl ou pelo diretório definido em `PAPER_SERVER_PATH`. Valide o servidor online na página `/status` e confirme que a fila de entregas volta a `OPERACIONAL` antes de reabrir vendas.

## 9. Corte de DNS e encerramento da VPS antiga

Quando a nova VPS estiver validada, aponte os registros A/AAAA do domínio, aguarde a propagação e execute uma compra controlada de baixo valor somente se necessário. Não crie cobrança por automatismo. Após confirmação, mantenha a VPS antiga desligada, mas preservada, por pelo menos sete dias ou até finalizar sua política de retenção.

Atualize o webhook do Mercado Pago somente se o domínio mudar. Se o domínio continuar `playstorcraft.com.br`, confirme apenas que o certificado e a rota estão saudáveis. Deixe somente o novo bot Discord ativo depois do corte.

## 10. Recuperação e rollback

| Situação | Ação segura |
| --- | --- |
| Nginx não valida | Restaure o backup em `/root/nginx-config-backups`, execute `nginx -t` e só então recarregue. |
| Aplicação não inicia | Leia `docker compose logs app`, confirme runtime 600 e banco disponível; não imprima valores secretos. |
| Banco restaurado incorretamente | Pare `app` e `discord-bot`, recrie MySQL conforme o procedimento e restaure o dump verificado por SHA-256. |
| Bot duplicado | Pare o bot da VPS antiga antes de ligar o novo; mantenha apenas um token conectado. |
| Paper não busca entregas | Confira URL HTTPS, nova chave do servidor, status no painel e logs do plugin. |
| Falha de pagamento/entrega | Consulte pedidos, webhook e auditoria; nunca marque pagamento como aprovado manualmente sem verificação pelo gateway. |

Para rollback total, restaure o DNS para a VPS antiga **somente se ela ainda tiver o banco mais recente**. Caso a nova VPS já tenha aceitado pedidos, trate o banco novo como fonte de verdade e não use a versão antiga sem reconciliação.

## 11. Rotina recomendada após a migração

Execute `backup-playstorcraft.sh` antes de mudanças importantes e em rotina regular; valide cada backup com `sha256sum -c SHA256SUMS` e realize restauração de teste periodicamente. Revise permissões do runtime, renovação de certificados, estado dos containers, status Paper, webhook Mercado Pago e logs de entrega. [8]

## Referências

[1]: [Docker Compose de produção](../deployment/vps/docker-compose.yml)

[2]: [Modelo de runtime seguro](../deployment/vps/runtime.template)

[3]: [Docker Engine — instalação no Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

[4]: [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

[5]: [Mercado Pago — notificações de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)

[6]: [Instalação do plugin Paper](minecraft-plugin.md)

[7]: [API de entregas Minecraft](minecraft-api.md)

[8]: [Operação e implantação da PlayStorCraft](deployment.md)
