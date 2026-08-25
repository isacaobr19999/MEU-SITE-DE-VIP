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

## RCON restrito na VPS

O RCON foi habilitado no Paper em 25 de agosto de 2026 para permitir diagnóstico e comandos controlados. A senha é aleatória, fica somente no runtime do servidor com permissão 600, a porta 25575 não é publicada pelo Docker nem liberada para acesso externo, e o acesso administrativo ocorre por túnel SSH. Foram confirmados os comandos de leitura `list`, `plugins` e `version`; o comando `discord` respondeu que exige um jogador, portanto o vínculo real ainda precisa ser executado dentro do Minecraft com uma conta de teste.

## Mensagens e cópia do código

O bot Discord agora apresenta o código em formato destacado, informa que ele expira em 10 minutos e pode ser usado uma única vez. Após o resgate, a resposta efêmera informa o jogador vinculado, orienta o uso de `/unlink` e oferece o botão **Copiar código**; a ação apenas reapresenta o código ao próprio usuário em uma resposta efêmera e não grava o valor em logs.

A confirmação no Minecraft é entregue pela fila legacy autenticada como `chat.discord`. Como o plugin legacy transforma esse tipo em `say [Discord] ...`, a confirmação aparece no chat do Paper para os jogadores online. A homologação final deve ser feita com um novo vínculo, pois vínculos já usados não são reprocessados.
