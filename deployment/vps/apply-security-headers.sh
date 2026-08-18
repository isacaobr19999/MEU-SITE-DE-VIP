#!/usr/bin/env bash
set -euo pipefail

config_path="/etc/nginx/sites-enabled/playstorcraft"
stamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="/root/nginx-config-backups"
backup_path="${backup_dir}/playstorcraft.backup-security-${stamp}"

mkdir -p "$backup_dir"
cp "$config_path" "$backup_path"

if ! grep -q 'Content-Security-Policy' "$config_path"; then
  sed -i '/client_max_body_size 10m;/a\
  server_tokens off;\
  add_header Strict-Transport-Security "max-age=31536000" always;\
  add_header X-Content-Type-Options "nosniff" always;\
  add_header X-Frame-Options "SAMEORIGIN" always;\
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
  add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;\
  add_header Content-Security-Policy "base-uri '\''self'\''; frame-ancestors '\''self'\''; object-src '\''none'\''" always;' "$config_path"
fi

if ! grep -q 'proxy_hide_header Cache-Control' "$config_path"; then
  sed -i '/proxy_set_header X-Forwarded-Proto \$scheme;/a\
    proxy_hide_header Cache-Control;\
    add_header Strict-Transport-Security "max-age=31536000" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header X-Frame-Options "SAMEORIGIN" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
    add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;\
    add_header Content-Security-Policy "base-uri '\''self'\''; frame-ancestors '\''self'\''; object-src '\''none'\''" always;\
    add_header Cache-Control "no-store, max-age=0" always;' "$config_path"
fi

if ! nginx -t; then
  cp "$backup_path" "$config_path"
  nginx -t
  printf 'Configuração inválida; restauração aplicada em %s\n' "$backup_path" >&2
  exit 1
fi

systemctl reload nginx
printf 'Cabeçalhos aplicados; backup em %s\n' "$backup_path"
