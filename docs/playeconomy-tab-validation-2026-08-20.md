# Validação de sugestões TAB — PlayEconomy

## Estado técnico confirmado

O servidor Paper carregou com sucesso o arquivo `PlayEconomy-16.4.4.jar`. O manifesto interno informa a versão `16.5.0-COMPLETE`; o componente `CommandSuggestionVisibility` está presente no JAR instalado e os logs confirmam que o PlayEconomy foi ativado com sucesso.

## Teste no jogo sem alterar permissões

O teste final deve ser feito por um jogador comum e por um administrador, sem conceder novas permissões. No chat, cada pessoa deve digitar `/` e pressionar **TAB**; depois, deve digitar o prefixo de um comando permitido seguido de espaço e pressionar **TAB** novamente para observar os subcomandos.

| Perfil | Resultado esperado |
|---|---|
| Jogador comum | Vê somente comandos e subcomandos para os quais já possui permissões PlayEconomy. Comandos administrativos não aparecem. |
| Administrador | Vê os comandos e subcomandos que já são permitidos pela função administrativa existente. |

Se alguma sugestão sem permissão aparecer, registre o texto exato do comando e não altere permissões; isso permite revisar somente a regra correspondente.
