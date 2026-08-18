#!/usr/bin/env bash
set -euo pipefail

# Executar como root na VPS. Não envia backups para a internet.
COMPOSE_FILE="${COMPOSE_FILE:-/opt/playstorcraft/deployment/vps/docker-compose.yml}"
RUNTIME_FILE="${RUNTIME_FILE:-/root/playstorcraft-runtime}"
ASSETS_DIR="${ASSETS_DIR:-/srv/playstorcraft-assets}"
OUTPUT_ROOT="${OUTPUT_ROOT:-/root/playstorcraft-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_DIR="${OUTPUT_ROOT}/${STAMP}"

require_file() {
  [[ -f "$1" ]] || { printf 'Arquivo obrigatório ausente: %s\n' "$1" >&2; exit 1; }
}

require_file "$COMPOSE_FILE"
require_file "$RUNTIME_FILE"

install -d -m 700 "$OUTPUT_DIR"
set -a
# shellcheck disable=SC1090
source "$RUNTIME_FILE"
set +a

compose=(docker compose --env-file "$RUNTIME_FILE" -f "$COMPOSE_FILE")
"${compose[@]}" ps

# --no-tablespaces evita a exigência desnecessária da permissão PROCESS no MySQL 8.
"${compose[@]}" exec -T mysql sh -lc 'mysqldump --no-tablespaces -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > "${OUTPUT_DIR}/mysql.sql"
gzip -9 "${OUTPUT_DIR}/mysql.sql"

if [[ -d "$ASSETS_DIR" ]]; then
  tar -C "$ASSETS_DIR" -czf "${OUTPUT_DIR}/store-assets.tar.gz" .
fi

# O nome do volume é configurável porque o Docker Compose pode variar o prefixo do projeto.
DISCORD_VOLUME="${DISCORD_VOLUME:-vps_discord_bot_data}"
if docker volume inspect "$DISCORD_VOLUME" >/dev/null 2>&1; then
  docker run --rm -v "${DISCORD_VOLUME}:/source:ro" -v "${OUTPUT_DIR}:/backup" alpine:3.20 sh -c 'tar -C /source -czf /backup/discord-bot-data.tar.gz .'
fi

if [[ -n "${PAPER_SERVER_PATH:-}" && -d "${PAPER_SERVER_PATH}" ]]; then
  tar -C "${PAPER_SERVER_PATH}" -czf "${OUTPUT_DIR}/paper-server-files.tar.gz" .
fi

cp "$RUNTIME_FILE" "${OUTPUT_DIR}/playstorcraft-runtime"
chmod 600 "${OUTPUT_DIR}/playstorcraft-runtime"
{
  printf 'created_at_utc=%s\n' "$STAMP"
  printf 'compose_file=%s\n' "$COMPOSE_FILE"
  printf 'assets_included=%s\n' "$([[ -d "$ASSETS_DIR" ]] && echo yes || echo no)"
  printf 'paper_included=%s\n' "$([[ -n "${PAPER_SERVER_PATH:-}" && -d "${PAPER_SERVER_PATH}" ]] && echo yes || echo no)"
  "${compose[@]}" ps --format 'table {{.Name}}\t{{.Image}}\t{{.State}}'
} > "${OUTPUT_DIR}/manifest.txt"

(cd "$OUTPUT_DIR" && sha256sum * > SHA256SUMS)
chmod -R go-rwx "$OUTPUT_DIR"
printf 'Backup concluído: %s\n' "$OUTPUT_DIR"
printf 'Transfira este diretório somente por canal seguro e criptografado.\n'
