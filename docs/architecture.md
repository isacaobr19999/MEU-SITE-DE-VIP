# Arquitetura da PlayStorCraft

## Visão geral

A PlayStorCraft será composta por uma aplicação web pública, uma área administrativa protegida e uma API transacional no mesmo serviço. O banco MySQL será a fonte de verdade para catálogo, pedidos, pagamentos, entregas, servidores e auditoria. O plugin Paper não deve receber dados de pagamento; ele acessará somente endpoints de entrega com uma credencial individual por servidor.

| Camada | Responsabilidade | Dados sensíveis |
| --- | --- | --- |
| Loja pública | Catálogo, busca, carrinho, criação de pedido e acompanhamento | Nunca recebe segredos de pagamento ou chaves de servidores |
| API | Regras de preço, cupom, pedidos, webhook, autorização e fila de entrega | Valida e usa credenciais exclusivamente no servidor |
| MySQL | Fonte de verdade e trilha de auditoria | Persiste apenas hashes de chaves, tokens ou senhas |
| Gateway de pagamento | PIX, cartão e confirmação da transação | Assinatura de webhook validada antes de qualquer mudança de estado |
| Plugin Paper | Consulta e conclui entregas autenticadas | Chave individual, com rotação e revogação pelo painel |

## Decisões de segurança

> Nenhuma ação de entrega é autorizada pelo navegador. Um pedido muda para `PAID` somente após uma notificação autenticada do gateway ou uma reconciliação confirmada no servidor.

Todos os valores monetários serão armazenados como inteiros em centavos. Cada evento externo terá uma chave de idempotência única, e cada entrega terá uma reivindicação atômica para impedir execução duplicada. As mutações administrativas exigirão usuário autenticado com função `admin`, serão validadas no servidor e gerarão registros de auditoria.

## Processamento em segundo plano

As entregas serão acionadas pelo plugin Minecraft: o servidor busca entregas pendentes, reivindica uma entrega de forma atômica, executa os comandos e informa o resultado. Isso mantém o processamento junto ao servidor que possui LuckPerms e evita que a aplicação web tente executar comandos remotos diretamente.

As expirações de VIP e a reabertura de entregas com tentativa vencida serão tratadas por uma chamada periódica idempotente autenticada. Essa rotina será ativada somente depois que a aplicação estiver publicada, pois ela depende de um endereço público estável.

## Opções de operação para automações

| Abordagem | Trade-offs | Custo | Complexidade de configuração |
| --- | --- | --- | --- |
| Entregas por consulta autenticada do plugin e rotinas periódicas curtas | Não exige processo permanente; o plugin controla a entrega no servidor correto. Há uma pequena latência definida pelo intervalo de consulta. | Baixo, usando a hospedagem gerenciada padrão. | Moderada, com chave por servidor e tarefa periódica publicada. |
| Trabalhador contínuo dedicado para filas e conexões persistentes | Permite menor latência e integrações contínuas, mas requer uma instância sempre ativa e monitoramento adicional. | Maior, pois mantém computação reservada continuamente. | Alta, por envolver operação permanente e observabilidade extra. |

Para a primeira versão, a implementação adotará a primeira abordagem. Caso o volume ou a latência exigida aumente, o modelo pode evoluir para um trabalhador contínuo sem alterar o contrato entre API e plugin.

## Variáveis de ambiente

Valores reais não serão versionados nem enviados ao navegador. A configuração do ambiente de implantação mantém os nomes abaixo; a tabela define o escopo operacional de cada um.

| Variável | Obrigatória | Uso | Escopo |
| --- | --- | --- | --- |
| `PLAYSTORE_PUBLIC_URL` | Sim | URL canônica da loja e origem de links públicos | Servidor e cliente por configuração segura |
| `PLAYSTORE_API_URL` | Sim | URL externa da API para webhooks e plugin | Servidor e plugin |
| `CORS_ALLOWED_ORIGINS` | Sim | Origens permitidas em chamadas de navegador | Servidor |
| `PAYMENT_PROVIDER` | Sim para pagamentos | Seleciona o adaptador de gateway | Servidor |
| `PAYMENT_ACCESS_TOKEN` | Sim para pagamentos | Autentica chamadas servidor a servidor ao gateway | Somente servidor |
| `PAYMENT_WEBHOOK_SECRET` | Sim para pagamentos | Verifica autenticidade dos webhooks | Somente servidor |
| `PAYMENT_NOTIFICATION_URL` | Sim para pagamentos | URL registrada no gateway para notificações | Somente servidor |
| `MINECRAFT_API_KEY_PEPPER` | Sim | Gera e verifica hashes das chaves de servidor | Somente servidor |
| `DELIVERY_CLAIM_TTL_SECONDS` | Sim | Limite de tempo de uma entrega reivindicada | Somente servidor |
| `DELIVERY_MAX_ATTEMPTS` | Sim | Teto de novas tentativas antes de exigir análise administrativa | Somente servidor |
| `ADMIN_BOOTSTRAP_EMAIL` | Opcional | E-mail que poderá receber função administrativa no primeiro acesso | Somente servidor |
| `RATE_LIMIT_WINDOW_SECONDS` | Sim | Janela de limitação de requisições críticas | Somente servidor |
| `RATE_LIMIT_MAX_REQUESTS` | Sim | Máximo de requisições por janela | Somente servidor |
| `CSRF_TRUSTED_ORIGINS` | Sim | Origens aceitas em mutações que dependam de cookie | Somente servidor |
| `DATABASE_URL` | Sim | Conexão MySQL fornecida pelo ambiente | Somente servidor |
| `JWT_SECRET` | Sim | Assinatura da sessão segura | Somente servidor |
