# Homologação segura Discord/Minecraft

## Objetivo

Validar o contrato entre loja, bot Discord e Paper sem cobrar compradores, sem usar produtos reais e sem substituir o plugin ativo antes de confirmar o rollback.

## Preparação

Use um servidor Paper de validação separado do servidor público, um jogador de teste, uma chave de integração exclusiva e um produto técnico desativado para vendas. Faça backup do JAR ativo e dos arquivos de configuração. Registre o commit da aplicação e a versão dos plugins antes do teste.

## Sequência sem cobrança

1. Confirmar `GET /api/integration/health` com a chave de integração.
2. Enviar um evento de heartbeat e confirmar idempotência com o mesmo identificador.
3. Publicar entrada e saída de jogador e confirmar que somente os metadados necessários são persistidos.
4. Criar código de vínculo, resgatar no Discord, confirmar uso único, expiração e revogação.
5. Executar `/discord link` e `/discord unlink` somente com o jogador de teste.
6. Verificar permissões para usuário comum e administrador; comandos administrativos não podem aparecer para quem não tem permissão.
7. Criar uma entrega técnica sem pagamento real, confirmar claim, execução no Paper, conclusão e ausência de duplicação em nova consulta.
8. Simular falha do servidor e confirmar retry/defer sem perda de pedido.
9. Restaurar o backup do plugin se qualquer regressão aparecer.

## Critérios de aprovação

A homologação só deve ser marcada como aprovada se todos os passos tiverem evidência em logs, o vínculo for único, o comando respeitar a permissão, a entrega não duplicar e o rollback tiver sido testado. Testes não executados devem permanecer explicitamente como não executados.

## Proibições

Não iniciar checkout do Mercado Pago, não usar cartão ou PIX, não ativar produto técnico para compradores, não copiar tokens para o repositório e não substituir o JAR de produção durante a primeira rodada.

## Estado atual

A aplicação contém as rotas legacy, os testes automatizados e a integração do bot. A execução mecânica de comandos e entrega no servidor de validação ainda depende de uma janela controlada com acesso ao Paper e deve ser realizada pelo operador autorizado.
