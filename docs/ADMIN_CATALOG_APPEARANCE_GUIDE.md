# Catálogo, galeria e aparência administrativa

## Galeria de produtos

No painel, abra **Catálogo**, escolha um produto e use a seção **Galeria de imagens**. A imagem principal permanece indicada como **Principal**. Para acrescentar uma imagem, informe uma URL HTTPS ou um caminho público iniciado por `/`, como um ativo já disponibilizado em `/manus-storage/`. Clique em uma miniatura para defini-la como imagem principal e use o botão de remoção apenas para itens complementares.

> A versão atual não recebe arquivos diretamente pelo painel, pois isso exigiria contratar e configurar um armazenamento externo na VPS. A galeria por URLs continua disponível sem custo adicional, e as imagens complementares podem ser reordenadas por arrastar e soltar ou pelos controles de direção.

| Regra | Comportamento |
|---|---|
| Armazenamento | A loja salva apenas as URLs da galeria no produto; os arquivos não são gravados no banco de dados. |
| Limite | Cada produto aceita até 12 URLs adicionais. |
| Vitrine | A primeira imagem é mostrada como capa. No detalhe público, jogadores podem alternar as miniaturas cadastradas. |
| Segurança | URLs relativas devem começar com uma única barra. URLs com protocolo inválido ou esquema de script são rejeitadas. |

## Comparação detalhada de VIPs

A página inicial compara somente VIPs ativos. A duração, o preço e os detalhes são lidos diretamente do catálogo. Quando a descrição informada for apenas a concessão do grupo por determinado período, a vitrine a apresenta de forma estruturada como **grupo incluído** e **duração**; ela não cria comandos, kits, tags ou outras vantagens não cadastradas.

## Promoção pública por cupom

O destaque no topo da vitrine é automático. Ele só aparece quando existe um cupom simultaneamente ativo, dentro do período configurado, abaixo do limite total de usos e aplicável a pelo menos um produto ativo. O cartão mostra o código, o formato do desconto e, quando configurada, a data e a hora de encerramento. A validação definitiva continua sendo feita na transação de checkout; portanto, o cartão não reserva uso, não altera preço e não substitui as regras de limite por jogador ou escopo de produto.

| Situação administrativa | Resultado na vitrine |
| --- | --- |
| Cupom ativo, válido e aplicável | O código é exibido como campanha ativa. |
| Cupom inativo, futuro, vencido, esgotado ou sem produto ativo compatível | Nenhum destaque é exibido. |
| Cupom aplicado no checkout | O pedido mostra subtotal, código, desconto e total final calculado pelo servidor. |

## Ativos visuais de fallback

As ilustrações próprias continuam sendo a primeira opção da vitrine. Caso uma imagem de categoria não possa ser carregada, a loja usa um ícone SVG público e gratuito hospedado no repositório Material Design Icons. Os três ícones usados representam VIP, Cash e Booster, respectivamente. O conjunto é distribuído sob a Licença Apache 2.0; os links são mantidos no código como URLs HTTPS de fallback, sem upload de arquivos para a VPS. [1]

## Aparência do painel

Em **Aparência**, o administrador pode visualizar os cartões de prévia dos modos claro e escuro antes de aplicar a escolha. A preferência fica no navegador usado para a administração e alcança apenas as rotas `/admin`; a vitrine pública continua no tema PlayStorCraft.

## Referências

[1] [Material Design Icons — licença Apache 2.0](https://github.com/Templarian/MaterialDesign-SVG/blob/master/LICENSE)
