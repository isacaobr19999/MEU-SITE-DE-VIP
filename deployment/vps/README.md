# Implantação na VPS

Os arquivos deste diretório implantam a aplicação e um MySQL 8.4 via Docker Compose. O Nginx do host recebe HTTP/HTTPS e encaminha apenas para `127.0.0.1:3000`; o banco não é exposto à internet.

O arquivo `.env` é criado somente na VPS e contém senhas aleatórias do MySQL, `JWT_SECRET`, `MINECRAFT_API_KEY_PEPPER` e, posteriormente, as credenciais do Mercado Pago. Ele não deve ser versionado ou copiado para o repositório.

Depois de iniciar os contêineres e aplicar as migrations, o certificado é emitido pelo Certbot para `playstorcraft.com.br` e `www.playstorcraft.com.br`.
