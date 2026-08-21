# Guia de Acesso Administrativo e Manutenção

Este guia reúne os caminhos administrativos essenciais da PlayStorCraft. Ele descreve acesso, operação e segurança sem registrar senhas, tokens, chaves de API ou valores de runtime.

## Acessos protegidos

| Área | Caminho | Finalidade | Quem pode usar |
|---|---|---|---|
| Painel administrativo completo | `/admin` | Catálogo, pedidos, cupons, métricas e configurações. | Conta com função `admin`. |
| Portal de manutenção | `/maintenance` | Entrada e saída de manutenção, agendamento, modo de catálogo e avisos. | Conta com função `admin`. |
| Auditoria de login | `/maintenance/security` | Tentativas recentes de acesso ao login por senha. | Conta com função `admin`. |
| Histórico público | `/maintenance-history` | Resumo seguro de manutenções concluídas. | Público. |

Os caminhos administrativos continuam disponíveis durante uma manutenção. A indisponibilidade pública bloqueia novas compras, mas não impede o administrador de operar a loja.

## Operação de manutenção

O portal dedicado permite escolher dois modos. Em **Loja fechada**, o público recebe uma página de manutenção. Em **Somente catálogo**, os produtos permanecem visíveis, mas checkout e novos pagamentos ficam bloqueados. Pedidos já confirmados continuam preservados e podem seguir o fluxo de entrega.

O agendamento aceita início e término. Na VPS, um trabalhador processa a transição de modo idempotente; o administrador não precisa manter o navegador aberto. A área também oferece prévia da página pública, modelos de mensagem, histórico de eventos e teste controlado de aviso no Discord.

## Comunicação no Discord

O canal de aviso pode ser definido no painel por ID. Caso não seja definido, o sistema mantém o canal operacional padrão como fallback. Os modelos disponíveis são **padrão**, **curto** e **comunitário**. O botão de teste apenas enfileira uma mensagem identificada como teste e não muda o estado público da loja.

> O bot deve manter somente as permissões necessárias no canal de destino, em especial **Ver canal** e **Enviar mensagens**. Não é necessário conceder Administrador para a operação cotidiana.

## Auditoria de acesso

Cada tentativa de login por senha gera um registro de resultado aprovado ou recusado. A visualização administrativa minimiza o e-mail, mostra o horário e não armazena senha, token ou endereço IP bruto. O acesso ao registro exige uma sessão autenticada com função administrativa.

## Recuperação de senha

A recuperação por e-mail está **adiada por decisão administrativa**. Para habilitá-la, deve-se configurar um serviço de e-mail transacional com uma credencial específica de aplicativo ou API. Senhas normais de contas de e-mail nunca devem ser usadas ou registradas no projeto.

## Validação operacional

Antes de uma manutenção programada, revise a prévia pública, confirme o canal Discord, faça um teste controlado e verifique os pedidos protegidos. Após a manutenção, confirme que a loja retornou ao estado online, que o aviso foi entregue e que o histórico registrou o evento.
