# PlayStorCraft — Instalação e Operação em VPS Ubuntu

**Versão do documento:** 1.0  
**Público:** administrador técnico da PlayStorCraft  
**Escopo:** instalação nova, migração, atualização, backup, restauração e diagnóstico operacional.

> **Regra de segurança:** este repositório contém apenas modelos e instruções. Nunca versione nem envie por chat o arquivo `/root/playstorcraft-runtime`, chaves SSH privadas, token do Discord, credenciais Mercado Pago, senhas MySQL, certificados TLS, chave RCON, backup do banco ou arquivos do Paper. Se algum segredo for exposto, faça rotação imediata.

## 1. Visão geral da arquitetura

A instalação de produção usa Docker Compose para a aplicação, o MySQL, o bot Discord, o monitoramento e o agendador de manutenção. O Nginx é executado no host Ubuntu e termina o HTTPS, enquanto o Paper pode estar no mesmo host, em Pterodactyl ou em outro servidor. O banco MySQL e os volumes do Discord são persistentes; não use comandos que removam volumes durante operação normal.

| Componente | Função | Persistência | Exposição pública |
| --- | --- | --- | --- |
| `app` | Loja React/Express, API, checkout, webhooks e fila de entregas | Banco MySQL | Apenas via Nginx em HTTPS |
| `mysql` | Pedidos, pagamentos, catálogo, usuários, cupons e auditoria | Volume `mysql_data` | Não expor porta 3306 |
| `discord-bot` | Comandos, tickets, status e vínculo Discord–Minecraft | Volume `discord_bot_data` | Conecta apenas à API Discord |
| `monitoring-agent` | Checagem periódica de saúde | Sem dados críticos | Rede interna Docker |
| `maintenance-scheduler` | Aplicação de manutenções programadas | Sem dados críticos | Rede interna Docker |
| Nginx + Certbot | HTTPS, proxy e assets estáticos | Configuração e certificados do host | Portas 80 e 443 |
| Paper | Entregas, status e vínculo Minecraft | Mundos, plugins e configurações | Porta Minecraft conforme o servidor |

O Compose mantém a aplicação em `127.0.0.1:3000`; portanto, ela não deve ser publicada diretamente na internet. A configuração Nginx versionada encaminha somente o tráfego HTTPS ao serviço interno. [1] [2]

## 2. Pré-requisitos

Use uma VPS com **Ubuntu 24.04 LTS**, IP público fixo, acesso `root` ou `sudo`, domínio próprio e memória suficiente para Docker, MySQL e os serviços escolhidos. Para uma instalação com Paper no mesmo host, considere separadamente a carga do servidor Minecraft.

| Item | Obrigatório | Observação |
| --- | --- | --- |
| Domínio | Sim | Exemplo: `playstorcraft.com.br` e `www` |
| DNS | Sim | Registros A para o IP da VPS; AAAA somente se IPv6 estiver configurado |
| SSH | Sim | Use chave ED25519; nunca compartilhe a chave privada |
| Docker Engine + Compose | Sim | Instale pelo guia oficial para Ubuntu [3] |
| Nginx e Certbot | Sim | Fazem o proxy HTTPS e emitem certificado |
| Conta Mercado Pago | Antes de vendas reais | Webhook configurado no domínio final |
| Bot Discord | Opcional, recomendado | Apenas uma instância do bot pode usar o token por vez |
| Paper/LuckPerms | Para entregas Minecraft | Pode estar em Pterodactyl ou host separado |

Antes de uma migração, reduza o TTL DNS para 300 segundos, planeje uma janela de manutenção e mantenha a VPS antiga disponível até a validação completa.

## 3. Preparar o Ubuntu

Entre por SSH usando uma chave autorizada. Atualize o sistema, instale os pacotes de suporte e ative somente as portas necessárias.

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx ufw rsync

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose
```

Instale Docker Engine e o plugin Docker Compose segundo a documentação oficial. Após isso, valide:

```bash
docker --version
docker compose version
systemctl enable --now docker
```

Não libere `3306` para a internet. Se o Paper estiver no mesmo host, libere apenas a porta de jogo usada pelo servidor; mantenha RCON sem publicação externa e acessível apenas pela rede local ou por túnel SSH.

## 4. Obter o código da loja

A instalação padrão usa `/opt/playstorcraft`. Para repositório privado, autentique o GitHub CLI ou use uma chave de implantação com acesso de leitura. Não armazene token do GitHub no repositório.

```bash
install -d -m 755 /opt
cd /opt
git clone https://github.com/isacaobr19999/MEU-SITE-DE-VIP.git playstorcraft
cd /opt/playstorcraft
git status --short
```

Confira se os arquivos essenciais existem:

```bash
test -f deployment/vps/docker-compose.yml
test -f deployment/vps/runtime.template
test -f deployment/vps/nginx-playstorcraft.conf
```

## 5. Criar o runtime privado

O runtime fica fora do Git em `/root/playstorcraft-runtime` e deve ter permissão `600`. Comece pelo modelo versionado e preencha os valores reais no host.

```bash
install -m 600 /dev/null /root/playstorcraft-runtime
cp /opt/playstorcraft/deployment/vps/runtime.template /root/playstorcraft-runtime
chmod 600 /root/playstorcraft-runtime
nano /root/playstorcraft-runtime
```

Gere valores fortes localmente. Um exemplo seguro para valores aleatórios é:

```bash
openssl rand -hex 32
```

Use um valor diferente para cada segredo. `APP_BASE_URL` deve usar o domínio HTTPS definitivo, sem barra final.

| Grupo | Variáveis principais | Regra operacional |
| --- | --- | --- |
| Banco | `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | Senhas exclusivas e longas |
| Aplicação | `APP_BASE_URL`, `JWT_SECRET`, `MINECRAFT_API_KEY_PEPPER`, `MAINTENANCE_SECRET`, `INTEGRATION_API_KEY` | Nunca expor no cliente ou log |
| Mercado Pago | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_WEBHOOK_SECRET` | Necessárias antes de liberar vendas reais |
| Discord | `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`, IDs de canais, `DISCORD_BOT_BRIDGE_SECRET` | Não iniciar duas instâncias com o mesmo token |
| Backup Paper | `PAPER_SERVER_PATH` | Opcional; caminho do volume/diretório Paper |

Confira apenas nomes e permissões, sem imprimir valores:

```bash
stat -c '%a %n' /root/playstorcraft-runtime
cut -d= -f1 /root/playstorcraft-runtime | sort
```

## 6. Primeira inicialização com Docker Compose

Inicie os serviços. A primeira execução constrói imagens e pode levar mais tempo.

```bash
cd /opt/playstorcraft
docker compose \
  --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml \
  up -d --build

docker compose \
  --project-name vps \
  --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml ps
```

Os serviços esperados são `mysql`, `app`, `discord-bot`, `monitoring-agent` e `maintenance-scheduler`. O bot pode permanecer parado ou falhar se as variáveis Discord ainda não foram preenchidas; nesse caso, preencha o runtime antes de ativá-lo. Não execute `docker compose down -v`: essa opção pode apagar o volume MySQL e dados persistentes.

Para consultar logs sem revelar o runtime:

```bash
docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml logs --tail=150 app
```

## 7. Nginx, DNS e HTTPS

Instale a configuração versionada no Nginx. Ajuste o domínio no arquivo se ele não for `playstorcraft.com.br` antes de habilitar.

```bash
cp /opt/playstorcraft/deployment/vps/nginx-playstorcraft.conf \
  /etc/nginx/sites-available/playstorcraft
ln -sfn /etc/nginx/sites-available/playstorcraft \
  /etc/nginx/sites-enabled/playstorcraft
nginx -t
systemctl reload nginx
```

No provedor DNS, aponte os registros A do domínio raiz e de `www` para o IP público da VPS. Quando a propagação estiver correta, emita o certificado:

```bash
certbot --nginx -d playstorcraft.com.br -d www.playstorcraft.com.br
```

Depois valide certificado, proxy e rota pública:

```bash
curl -fsSI https://playstorcraft.com.br/
curl -fsSI https://playstorcraft.com.br/status
```

O Nginx servido pelo projeto encaminha a aplicação a `127.0.0.1:3000`, serve `/store-assets/` a partir de `/srv/playstorcraft-assets` e define cabeçalhos de segurança/caching adequados. [2]

## 8. Configurar integrações externas

### Mercado Pago

No painel Mercado Pago, registre o webhook de **Pagamentos** em:

```text
https://SEU-DOMINIO/api/webhooks/mercadopago
```

Preencha as três variáveis Mercado Pago no runtime e recrie somente a aplicação:

```bash
cd /opt/playstorcraft
docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml up -d --build --force-recreate app
```

> Uma entrega só é liberada após a confirmação de pagamento no backend/webhook. O redirecionamento do navegador não substitui a confirmação do gateway. [4] [5]

### Discord

Configure o token, a aplicação, guild, convite e IDs de canais apenas em `/root/playstorcraft-runtime`. Depois recrie o serviço do bot:

```bash
cd /opt/playstorcraft
docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml up -d --build --force-recreate discord-bot

docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml logs --tail=80 discord-bot
```

Mantenha somente uma instância do bot conectada por token. Durante migração, pare o bot antigo antes de iniciar o novo para evitar mensagens, status e comandos duplicados.

### Paper e entregas Minecraft

Instale o plugin da loja no Paper, configure a URL HTTPS da loja e uma chave de servidor exclusiva. Ao migrar de VPS ou suspeitar de exposição, rotacione a chave pelo painel administrativo e atualize o `config.yml` privado do plugin. A API usa o claim de entrega para impedir execução duplicada. Consulte [a documentação do plugin](minecraft-plugin.md) e [a API Minecraft](minecraft-api.md).

Para o plugin DiscordBoosterLink, mantenha somente um JAR ativo com o mesmo nome de plugin. A versão Paper 3.0.4 mostra o código de vínculo como texto clicável com cópia nativa. Faça backup do JAR anterior antes de trocar e reinicie apenas o container Paper.

## 9. Validação pós-instalação

O projeto inclui um script de verificação que confere Compose, Nginx, HTTPS e rotas públicas sem criar pedidos ou cobranças:

```bash
cd /opt/playstorcraft
bash deployment/vps/verify-playstorcraft.sh
```

Além do script, faça a validação manual abaixo.

| Área | Validação mínima |
| --- | --- |
| Loja | `/`, catálogo, detalhe de produto, carrinho e rotas públicas retornam sem erro |
| Autenticação | Cadastro/login, perfil e acesso de administrador com conta autorizada |
| Administração | Catálogo, cupons, pedidos, manutenção, aparência e monitoramento |
| Pagamentos | Webhook cadastrado; teste controlado somente quando autorizado |
| Discord | Bot online, comandos registrados e canais de status/operacional corretos |
| Minecraft | Status online, health da integração, telemetria e fila sem erro |
| Mobile | Home, login, carrinho, pedido e administração com navegação utilizável |

## 10. Atualização normal de código

Antes de publicar, valide localmente o commit escolhido:

```bash
pnpm test
pnpm check
pnpm build
git status --short
git log --oneline -1
```

Na VPS, atualize o repositório ou sincronize somente os arquivos versionados. Em seguida recrie **apenas** o serviço afetado. Para a aplicação:

```bash
cd /opt/playstorcraft
git pull --ff-only origin main
docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml up -d --build --force-recreate app
```

Quando a alteração estiver em `discord-bot/`, recrie também `discord-bot`. Para alterações de banco, gere e revise a migration, faça backup validado e aplique a mudança em ordem controlada antes de reiniciar serviços. Não trate um rollback de interface como motivo para restaurar um banco antigo.

## 11. Backup, integridade e retenção

O script versionado cria dump MySQL comprimido, assets, dados do bot, runtime protegido, manifesto, hashes SHA-256 e, quando `PAPER_SERVER_PATH` estiver configurado, arquivos Paper.

```bash
cd /opt/playstorcraft
PAPER_SERVER_PATH=/CAMINHO/DO/PAPER \
  bash deployment/vps/backup-playstorcraft.sh

cd /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ
sha256sum -c SHA256SUMS
```

Transfira o diretório por canal seguro e criptografado, mantenha uma cópia fora da VPS e aplique permissões restritas. Uma política mínima é manter backups diários recentes, semanais e mensais. Um backup que não passou por restauração de teste deve ser tratado como não verificado.

## 12. Restaurar em nova VPS

Após instalar Docker, clonar o código e restaurar o runtime privado, suba primeiro o MySQL e importe o dump.

```bash
cd /opt/playstorcraft
docker compose --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml up -d mysql

gzip -dc /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ/mysql.sql.gz \
  | docker compose --env-file /root/playstorcraft-runtime \
      -f deployment/vps/docker-compose.yml exec -T mysql \
      sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Restaure os assets antes de expor a loja:

```bash
install -d -m 755 /srv/playstorcraft-assets
tar -C /srv/playstorcraft-assets -xzf \
  /root/playstorcraft-backups/AAAA-MM-DDTHHMMSSZ/store-assets.tar.gz
```

Se houver backup do bot, restaure o volume antes de ligar `discord-bot`. Transfira o Paper pelo backup Pterodactyl ou `PAPER_SERVER_PATH`; depois rotacione a chave da integração Minecraft e valide a telemetria. Mantenha a VPS antiga preservada até que banco, catálogo, login, status, bot e Paper estejam confirmados.

## 13. Rollback e incidentes

| Situação | Resposta segura |
| --- | --- |
| App não inicia | Ver logs `app`, conferir runtime `600`, banco e última migration; não imprimir valores secretos |
| Nginx inválido | Restaurar a cópia anterior, executar `nginx -t` e somente então recarregar |
| Bot duplicado | Parar o bot antigo; nunca manter duas instâncias com o mesmo token |
| Webhook falha | Conferir URL HTTPS, segredo e logs; não aprovar pedido manualmente sem verificar o gateway |
| Paper não entrega | Conferir URL, chave rotacionada, health, logs e fila; não reexecutar comando sem claim válido |
| Erro visual após update | Retornar a um commit conhecido e recriar apenas `app`; não restaurar o banco por regressão de UI |
| Restauração de banco | Parar `app` e `discord-bot`, verificar o timestamp do dump e reconciliar pedidos recentes antes de trocar a fonte de verdade |

Para um rollback de código, use `git log` para escolher um commit aprovado, faça backup e reaplique o Compose. Não use `docker compose down -v` e não mude DNS para uma VPS antiga se ela não tiver os pedidos mais recentes.

## 14. Rotina de operação

Em operação normal, acompanhe diariamente status de containers, HTTPS, espaço em disco, logs de aplicação, fila Minecraft, Discord e webhook. Antes de mudanças críticas, faça backup e registre o commit, os serviços afetados, migrations e resultado dos testes.

```bash
cd /opt/playstorcraft
docker compose --project-name vps --env-file /root/playstorcraft-runtime \
  -f deployment/vps/docker-compose.yml ps

df -h
systemctl status nginx --no-pager
```

Revise periodicamente renovação de certificados, permissões do runtime, firewall, backup/restauração, expiração de cupons, logs de login e status do Paper. Mantenha um procedimento separado para mudanças que envolvam cobranças reais, pagamentos ou comandos de entrega.

## 15. Checklist de go-live

Antes de abrir vendas, confirme os itens abaixo de ponta a ponta.

| Item | Resultado esperado |
| --- | --- |
| DNS e certificado | Domínio HTTPS responde sem aviso de certificado |
| Contêineres | Serviços necessários em execução, sem reinicialização contínua |
| Banco | MySQL persistente e backup com SHA-256 válido |
| Loja | Catálogo, login, carrinho e painel funcionam em desktop e celular |
| Mercado Pago | Credenciais corretas e webhook público cadastrado |
| Discord | Uma única instância do bot conectada e comandos disponíveis |
| Paper | Plugin online, chave exclusiva e status/telemetria saudáveis |
| Backup | Cópia externa e plano de restauração documentados |

## Referências

[1]: [Compose de produção](../deployment/vps/docker-compose.yml)

[2]: [Configuração Nginx versionada](../deployment/vps/nginx-playstorcraft.conf)

[3]: [Docker Engine — instalação no Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

[4]: [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

[5]: [Mercado Pago — notificações de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)

[6]: [Runbook de migração de VPS](vps-migration-runbook.md)

[7]: [Guia de releases e backups](RELEASE_AND_BACKUP_GUIDE.md)
