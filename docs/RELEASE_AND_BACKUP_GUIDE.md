# Releases, backups e restauração da PlayStorCraft

## Objetivo

Este guia define uma rotina segura para atualizar a PlayStorCraft, preservar dados comerciais e restaurar a operação sem remover volumes do MySQL ou do Paper.

## Antes de uma atualização

Confirme o commit que será implantado, faça uma cópia do runtime fora do Git e execute `deployment/vps/backup-playstorcraft.sh` como root na VPS. Valide o manifesto com `sha256sum -c SHA256SUMS`, confira o espaço disponível e registre o horário do backup. Nunca use `docker compose down -v`, pois essa opção pode remover dados persistentes.

## Release

Cada release deve registrar o commit do GitHub, a data, as migrations incluídas, os serviços afetados e o resultado dos testes. Execute `pnpm test`, `pnpm check` e `pnpm build` antes da publicação. Em alterações de banco, revise o SQL gerado, faça backup validado e aplique a migration em ordem controlada antes de reiniciar a aplicação.

## Verificação após deploy

Confirme HTTP 200 da loja, login administrativo, catálogo, consulta de status, bot Discord, webhook do Mercado Pago e fila de entregas. Para a integração Minecraft, confirme primeiro health check e telemetria; os testes que possam executar comandos ou gerar entrega devem ocorrer em servidor de validação, com produto de teste e sem cobrança real.

## Restauração

Para restaurar arquivos, pare somente o serviço afetado, preserve os logs e recupere o backup correspondente. Para banco, restaure apenas após confirmar o timestamp e a integridade do dump; não misture um banco antigo com pedidos recentes sem reconciliação. Para rollback da aplicação, retorne a um commit conhecido e aprovado, sem alterar os dados comerciais por causa de uma regressão visual.

## Retenção mínima recomendada

Mantenha cópias diárias recentes, cópias semanais e pelo menos uma cópia mensal fora do diretório de trabalho da aplicação. A restauração deve ser testada periodicamente em ambiente separado. Um backup que nunca foi restaurado deve ser tratado como não verificado.

## Limites conhecidos

O projeto não considera homologação completa dos comandos e entregas do plugin legado Discord/Minecraft até que esses fluxos sejam executados em ambiente seguro. Também não considera teste de stress de produção como concluído sem carga controlada e evidência registrada.
