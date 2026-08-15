# Validação visual de produção — 15 de agosto de 2026

## Vitrine pública

A página inicial em `https://playstorcraft.com.br/` carregou com navegação, busca, categoria e produto técnico visíveis. O catálogo exibiu o produto **Validação técnica de pagamento**, classificado como VIP permanente no valor de **R$ 1,00**. A versão de desenvolvimento também foi verificada visualmente em desktop e em viewport móvel de 375 × 812; a hierarquia, os botões e o empilhamento das seções permaneceram legíveis e navegáveis.

A página pública de detalhe do produto também foi aberta em produção. O nome, descrição, preço, duração e servidor de destino foram exibidos corretamente. A ação **Adicionar ao carrinho** retornou a confirmação visual de inclusão sem iniciar checkout ou pagamento.

Na vitrine, o carrinho foi aberto após a inclusão. O item técnico, o servidor de destino, a quantidade, o subtotal de **R$ 1,00** e a ação **Continuar para pagamento** foram exibidos corretamente. A etapa de pagamento não foi iniciada durante esta validação visual.

A tela de login própria foi aberta no domínio de produção e exibiu os controles de entrar e cadastrar, campos de e-mail e senha e mensagem de credenciais protegidas no servidor. O envio das credenciais redirecionou para a página inicial; a sessão será verificada separadamente no histórico de pedidos para concluir a validação do fluxo.

O modo de cadastro também foi aberto em produção, exibindo nome, e-mail, senha mínima de 10 caracteres e ação de criação de conta. Para não criar uma conta descartável no banco de produção, o comportamento de submissão foi validado por testes isolados: dados incompletos retornam erro, e-mail duplicado retorna conflito sem alterar a conta existente e dados válidos criam uma conta comum com sessão própria.

O mesmo formulário de cadastro foi submetido em produção com o e-mail da conta existente. O sistema retornou a mensagem **"Este e-mail já está cadastrado."**, sem criar ou modificar usuário. Em viewport móvel de 375 px, o modo Cadastrar manteve os campos, a ação de criação e a mensagem de conflito acessíveis; a inspeção confirmou ausência de rolagem horizontal.

O histórico de pedidos foi acessado logo após o envio das credenciais, confirmando que a sessão própria foi estabelecida. Os pedidos técnicos e seus estados foram carregados para a conta autenticada, sem iniciar nenhum novo pagamento.

## Painel administrativo

Com a sessão administrativa já autenticada, `/admin` carregou as métricas e os formulários para criar categorias, produtos, servidores e cupons. A página também mostrou o servidor técnico ativo, a conta administrativa e a auditoria recente. Os dois pedidos vinculados às cobranças sandbox recusadas aparecem como `FAILED`, sem entregas pendentes nem erros de entrega, o que está coerente com a ausência de confirmação de pagamento.

A nova área `/admin/catalog` foi validada após a implantação na VPS. Ela carregou categoria, produto e servidor técnico e apresentou a navegação lateral de catálogo. O editor de produto foi aberto sem salvar mudanças e exibiu campos de categoria, tipo, preço, posição, duração, grupo LuckPerms, descrições, imagem, comandos, destinos e disponibilidade.

Em viewport móvel de **375 × 812**, a mesma área administrativa exibiu o cabeçalho móvel, os cards de gestão e o editor de produto. A inspeção de viewport confirmou largura CSS de 375 px e ausência de rolagem horizontal (`scrollWidth` igual ao `clientWidth`), preservando acesso aos campos e ao botão de salvar.

O histórico de pedidos também foi aberto dentro da sessão móvel emulada. A lista apresentou número, data, estado e valor de cada pedido; a inspeção confirmou largura CSS de 375 px, `scrollWidth` igual ao `clientWidth` e ausência de rolagem horizontal da página.

O detalhe de pedido recusado foi aberto na mesma sessão móvel. A mensagem de pagamento não aprovado e ausência de entrega permaneceu visível, com largura CSS de 375 px e sem rolagem horizontal.

A vitrine foi reaberta na sessão móvel emulada; o catálogo e o botão de carrinho permaneceram acessíveis. A inspeção confirmou largura CSS de 375 px e ausência de rolagem horizontal da página.

O carrinho foi aberto na mesma sessão móvel, exibindo produto, servidor, quantidade, subtotal e ação de continuação para pagamento. A página permaneceu sem rolagem horizontal; nenhuma etapa de pagamento foi iniciada.

O painel principal em `/admin` também foi validado na sessão móvel. As métricas, as seções de catálogo, operações e governança, bem como os formulários administrativos, foram exibidos e navegáveis. A inspeção confirmou largura CSS de 375 px e ausência de rolagem horizontal.

Para avaliar o comportamento transitório sem afetar visitantes reais, as chamadas da API foram bloqueadas apenas na sessão de teste móvel. A área administrativa apresentou a tela segura de autenticação/continuidade em vez de dados parciais. As chamadas foram liberadas em seguida e o painel retornou com métricas, catálogo e operações carregados normalmente.

## Limites desta inspeção

Esta verificação foi visual e não substitui o teste de uma compra real aprovada. A aprovação fim a fim via Checkout Pro continua pendente do uso manual de uma conta compradora de teste, em janela anônima, ou da ativação posterior de credenciais reais.

## Histórico e detalhe de pedidos

O histórico autenticado exibiu os pedidos técnicos com estados e totais, inclusive as duas recusas sandbox como `FAILED`. No detalhe de um pedido recusado, o estado foi exibido sem indicar entrega liberada. Foi identificada, contudo, uma mensagem informativa genérica de confirmação futura que deve ser substituída por uma comunicação específica para estados `FAILED`, deixando claro que o pagamento não foi aprovado e que não há entrega disponível.

Após a implantação da correção na VPS, o mesmo detalhe foi validado novamente em `https://playstorcraft.com.br`. A mensagem agora informa explicitamente: **"O pagamento não foi aprovado. Nenhuma entrega foi liberada para este pedido."** A página também usa sinalização visual de alerta para o status `FAILED`.
