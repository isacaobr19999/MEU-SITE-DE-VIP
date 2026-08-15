# Referência de ambiente

Este arquivo é uma **referência pública de nomes**, e não deve ser copiado como um arquivo de segredos. Cadastre os valores correspondentes na área de segredos do projeto.

| Variável | Exemplo de formato | Uso no código |
| --- | --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | `APP_USR-...` ou `TEST-...` | `server/services/mercadoPago.ts` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | segredo opaco definido pelo gateway | `server/services/mercadoPago.ts` |
| `APP_BASE_URL` | `https://loja.seudominio.com` | URLs de retorno e `notification_url` |
| `MINECRAFT_API_KEY_PEPPER` | segredo aleatório de alta entropia | hash e validação de chaves de servidores |

Os valores jamais devem ser incluídos no repositório, no `config.yml` distribuído ou em código do cliente. As chaves individuais dos servidores Paper são reveladas uma única vez pelo fluxo administrativo e preservadas apenas como hash.
