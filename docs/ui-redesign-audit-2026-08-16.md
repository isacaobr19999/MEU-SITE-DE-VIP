# Auditoria visual — PlayStorCraft

## Estado observado

A vitrine já utiliza uma base escura com acento esmeralda, porém a expressão visual ainda é próxima de um painel SaaS genérico. A assinatura de marca, os estados vazios, os portões de autenticação e a experiência administrativa têm pouca presença do universo de jogo. A estrutura também depende de classes repetidas em páginas, dificultando a consistência de espaçamento, foco e superfícies.

## Direção aprovada para implementação

> **Comércio premium de progressão para Minecraft:** superfícies profundas em azul-noite, acento esmeralda-luminoso, detalhes minerais/arquitetônicos discretos e linguagem de inventário, recompensa e servidor oficial.

| Área | Problema visual atual | Direção de melhoria |
|---|---|---|
| Vitrine | Hero e cards corretos, mas genéricos; estados vazios pouco memoráveis | Superfícies em camadas, marca de item/loot, contraste de preços e CTAs de progressão |
| Checkout | Modal funcional, mas sem resumo visual de confiança e recompensa | Hierarquia de total, selo de entrega e estados de cupom mais claros |
| Login | Boa composição inicial, porém pouco integrada à identidade do jogo | Painel de acesso com marca, benefício e microdetalhes consistentes |
| Pedidos | Estados protegidos e vazios excessivamente neutros | Cards de missão/entrega, status legíveis e próximos passos claros |
| Administração | Navegação e estados sem assinatura visual própria | Sistema operacional em painéis, tabelas e ações com maior contraste e densidade controlada |

## Restrições preservadas

Nenhuma regra de comércio, autenticação, pagamento, entrega, cupom ou autorização será alterada pela reformulação. As mudanças serão limitadas à apresentação, navegação, feedback visual e acessibilidade.

## Achados de responsividade

| Viewport | Achado | Ajuste previsto |
|---|---|---|
| Desktop | A navegação da vitrine é limpa, mas o hero ainda fica visualmente vazio quando a mídia não está disponível no ambiente de prévia. | Criar um tratamento de mídia robusto e uma composição que preserve valor visual com ou sem imagem. |
| Celular | A base responde corretamente, mas o hero, os filtros e os cards poderiam formar uma sequência de compra mais intencional. | Reduzir folgas improdutivas, dar prioridade a CTA/preço e criar superfícies de leitura mais fortes. |
| Celular | Login funciona, porém perde a camada de contexto e confiança exibida no desktop. | Levar os sinais de marca, segurança e propósito para o cabeçalho do formulário móvel. |
| Estados protegidos | Pedidos e painel preservam a função, mas são muito vazios e pouco orientadores. | Criar painéis compactos com ícone de marca, contexto da próxima ação e hierarquia de CTA. |

## Validação após a implementação

As telas públicas, de acesso e os estados protegidos foram revisados em 1280×720 e 375×812. A nova hierarquia mantém CTAs visíveis no celular, os formulários preservam dimensão de toque adequada, e os painéis de erro ou autenticação ficam centralizados e legíveis sem perder a identidade visual. A prévia local não possui a rota de mídia comercial da VPS, por isso o hero é exibido com a composição de fallback; a imagem continua configurada na URL pública versionada usada em produção.
