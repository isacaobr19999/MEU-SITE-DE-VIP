#!/usr/bin/env bash
set -euo pipefail

# Executar na VPS após instalação, restauração ou atualização.
COMPOSE_FILE="${COMPOSE_FILE:-/opt/playstorcraft/deployment/vps/docker-compose.yml}"
RUNTIME_FILE="${RUNTIME_FILE:-/root/playstorcraft-runtime}"

[[ -f "$COMPOSE_FILE" ]] || { printf 'Compose não encontrado: %s\n' "$COMPOSE_FILE" >&2; exit 1; }
[[ -f "$RUNTIME_FILE" ]] || { printf 'Runtime não encontrado: %s\n' "$RUNTIME_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$RUNTIME_FILE"
set +a

base_url="${APP_BASE_URL:?APP_BASE_URL deve estar definido}"
compose=(docker compose --env-file "$RUNTIME_FILE" -f "$COMPOSE_FILE")

printf '%s\n' '--- Serviços Docker ---'
"${compose[@]}" ps

printf '%s\n' '--- Nginx ---'
nginx -t
systemctl is-active nginx

printf '%s\n' '--- Cabeçalhos públicos ---'
curl --fail --silent --show-error --max-time 15 -I "${base_url}/" | grep -Ei '^(HTTP/|strict-transport-security:|content-security-policy:|x-content-type-options:|x-frame-options:|cache-control:)'

printf '%s\n' '--- Rotas operacionais ---'
for route in / /rules /news /status; do
  code="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' "${base_url}${route}")"
  [[ "$code" == "200" ]] || { printf 'Falha em %s: HTTP %s\n' "$route" "$code" >&2; exit 1; }
  printf '%s -> HTTP %s\n' "$route" "$code"
done

printf 'Verificação concluída para %s\n' "$base_url"
