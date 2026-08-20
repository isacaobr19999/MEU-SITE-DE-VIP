# Validação da auditoria de login — 20/08/2026

## Proteção de dados

Cada login por senha gera um registro de sucesso ou recusa sem armazenar senha, token ou endereço IP bruto. A visualização administrativa mostra apenas um identificador de e-mail minimizado, o resultado e o horário.

## Controle de acesso

A rota `/maintenance/security` exige sessão e função administrativa. Sem autenticação, ela orienta o visitante a entrar pelo portal de manutenção. A tela de bloqueio foi revisada em desktop (1280×720) e celular (375×812), com conteúdo legível nos dois tamanhos.

## Recuperação por e-mail

A recuperação de senha permanece adiada até que exista um serviço de e-mail transacional configurado com uma credencial própria. Senhas normais de contas de e-mail não são utilizadas pelo projeto.
