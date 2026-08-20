# Validação da publicação de políticas — 20 de agosto de 2026

As políticas **Privacidade e dados da PlayStorCraft** e **Reembolso, entrega e suporte de compra** foram inseridas como conteúdo `POLICY` publicado, e as rotas `/privacy`, `/refund` e `/policies` responderam HTTP 200.

Durante a primeira leitura visual, os caracteres acentuados apareceram com codificação incorreta. A inspeção dos bytes confirmou texto em dupla codificação no banco (`C3 83 C2 A3` para `ã`). A conversão reversível de `latin1` para `utf8mb4` foi testada em consulta, aplicada aos campos `summary` e `body` e protegida por backup MySQL. A leitura direta via MySQL passou a apresentar `Versão`, `análise`, `período` e demais acentos corretamente.

A visualização aberta no navegador permaneceu com conteúdo anterior em memória após a atualização; a próxima checagem deve usar uma nova navegação com parâmetro de cache para confirmar a resposta atual da API pública.

## Confirmação pública sem cache

Uma nova navegação com parâmetro de validação confirmou os dois textos com acentuação correta. A vitrine pública também confirmou a seção **Em destaque** com somente `10.000 Cash` e `Booster 3x por 30 dias`, cada um identificado como destaque e preservando seus respectivos preços, descrições e botões de compra.
