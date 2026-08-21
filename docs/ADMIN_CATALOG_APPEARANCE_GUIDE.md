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

A página inicial compara somente VIPs ativos. A duração, o preço e os detalhes são lidos diretamente do catálogo. A comparação não cria vantagens, avaliações ou promessas novas: se um produto não tiver detalhes cadastrados, o jogador é direcionado para a página do produto.

## Aparência do painel

Em **Aparência**, o administrador pode visualizar os cartões de prévia dos modos claro e escuro antes de aplicar a escolha. A preferência fica no navegador usado para a administração e alcança apenas as rotas `/admin`; a vitrine pública continua no tema PlayStorCraft.
