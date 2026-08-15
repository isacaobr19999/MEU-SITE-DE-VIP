# Referência Técnica Externa

| Assunto | Referência | Uso no projeto |
| --- | --- | --- |
| Consultas e bloqueios transacionais no ORM | [Drizzle ORM — Select](https://orm.drizzle.team/docs/select) | A implementação de cupom mantém uma leitura bloqueada dentro da transação para reduzir condições de corrida durante a validação de limites de uso. |
| Semântica de locking read no MySQL | [MySQL Reference Manual — Locking Reads](https://dev.mysql.com/doc/refman/8.3/en/innodb-locking-reads.html) | O bloqueio de linha é usado apenas dentro da transação que cria o pedido e registra o uso do cupom. |
