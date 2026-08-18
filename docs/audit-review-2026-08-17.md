# Revisão da auditoria externa — 17 de agosto de 2026

## Evidências públicas verificadas

A página `/rules` mantém o alinhamento com os canais oficiais `📜-regra` e `⚖️-regras-do-mercado`, mas não possui regras publicadas na própria loja. A página `/news` não possui comunicados publicados. Ambas as situações reduzem a confiança comercial da vitrine e devem ser resolvidas antes de uma divulgação ampla.

O cabeçalho que exibe links operacionais foi observado em sessão autenticada como administrador. No código, o link `Operação` é condicionado ao papel administrativo; portanto, a auditoria deve tratar esse ponto como risco de apresentação na sessão de equipe, não como exposição comprovada ao visitante anônimo. A autorização das APIs continua uma verificação técnica separada.

O catálogo público ativo está associado ao único destino atualmente chamado `Servidor de validação`, nome que foi previamente confirmado pelo titular como destino operacional. Mesmo assim, o nome é inadequado para comunicação comercial e deve ser renomeado antes de promover a loja, pois sugere homologação ao comprador.

Em 18 de agosto de 2026, o destino comercial foi renomeado para `PlayStorCraft` sem alterar o identificador do servidor, a integração Paper ou os vínculos de produtos. As orientações públicas de entrega, suporte e canais oficiais, além de um primeiro comunicado de atualização da loja, foram publicados. Uma primeira gravação apresentou caracteres corrompidos; o conteúdo foi regravado com UTF-8 explícito e a página `/rules` foi revalidada com acentuação correta.

A página `/news` foi revisada após a mesma correção UTF-8 e exibe o comunicado “Loja oficial atualizada” de forma legível. As páginas de regras e novidades agora possuem conteúdo público e o cabeçalho de segurança aplicado na VPS continua compatível com o carregamento da interface.

Os cabeçalhos HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e uma CSP de base foram confirmados nas rotas públicas dinâmicas; estas também passaram a receber `Cache-Control: no-store`. Os ativos de imagem permanecem com cache imutável. A página pública do produto 1.000 Cash carregou normalmente após a mudança de nome; a presença do selo de destino será verificada de forma específica antes de encerrar a entrega.

A revalidação do produto 1.000 Cash confirmou o selo `PlayStorCraft` ao lado da duração permanente, substituindo a apresentação anterior de `Servidor de validação` na página pública de produto.

O Paper foi reiniciado de modo controlado para aplicar o MOTD configurado. A instância voltou a operar com plugins essenciais carregados, e a telemetria posterior confirmou `PlayStorCraft` no status público, com o servidor online e a fila de entregas operacional.
