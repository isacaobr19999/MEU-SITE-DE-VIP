# Validação do portal de manutenção — 20/08/2026

## Controle de acesso

A rota `/maintenance` apresenta uma tela dedicada de login por e-mail e senha quando não há sessão. O portal usa a autenticação própria já existente; não há credencial padrão, senha embutida ou cookie separado.

As contas sem a função administrativa recebem uma página de acesso negado. Somente contas administrativas podem visualizar os controles de manutenção, agendamento e teste de aviso.

## Revisão visual

A tela de login foi revisada em desktop (1280×720) e celular (375×812). Campos, botão de entrada e link de retorno ficaram visíveis e legíveis nos dois tamanhos.
