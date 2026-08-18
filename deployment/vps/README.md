# Implantação na VPS

Este diretório contém a infraestrutura versionada da PlayStorCraft: Compose, Dockerfiles, Nginx, modelo de ambiente, backup, verificação e cabeçalhos de segurança. O Nginx recebe HTTP/HTTPS e encaminha apenas para `127.0.0.1:3000`; o banco não é exposto à internet.

| Arquivo | Uso |
| --- | --- |
| `docker-compose.yml` | Aplicação, MySQL 8.4 e bot Discord em redes internas. |
| `runtime.template` | Lista de variáveis que devem ser preenchidas somente em `/root/playstorcraft-runtime`. |
| `backup-playstorcraft.sh` | Backup local seguro de banco, assets, bot e, opcionalmente, Paper. |
| `verify-playstorcraft.sh` | Verificação pós-instalação de serviços, HTTPS, cabeçalhos e rotas. |
| `apply-security-headers.sh` | Aplica cabeçalhos de produção com teste e backup reversível. |

Leia o guia completo em [`../../docs/vps-migration-runbook.md`](../../docs/vps-migration-runbook.md) antes de instalar, restaurar ou trocar de VPS.
