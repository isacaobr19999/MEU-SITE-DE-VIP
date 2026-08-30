#!/bin/sh
set -eu

APP_URL="${PLAYSTORCRAFT_APP_URL:-http://app:3000}"
INTERVAL="${MONITOR_INTERVAL_SECONDS:-300}"
SECRET="${MAINTENANCE_SECRET:-}"
STATUS_URL="$APP_URL/api/trpc/community.status?input=%7B%22json%22%3Anull%7D"
REPORT_URL="$APP_URL/api/internal/monitoring"

check_url() {
  key="$1"
  url="$2"
  started="$(date +%s%3N 2>/dev/null || date +%s000)"
  body_file="/tmp/monitor-${key}.json"
  code="$(curl --silent --show-error --max-time 20 --output "$body_file" --write-out '%{http_code}' "$url" 2>/dev/null || printf '000')"
  finished="$(date +%s%3N 2>/dev/null || date +%s000)"
  latency_ms=$(( finished - started ))
  if [ "$code" = "200" ]; then
    printf '{"serviceKey":"%s","status":"ONLINE","latencyMs":%s,"message":"HTTP 200"}' "$key" "$latency_ms"
  else
    printf '{"serviceKey":"%s","status":"OFFLINE","latencyMs":%s,"message":"HTTP %s"}' "$key" "$latency_ms" "$code"
  fi
}

while true; do
  store_report="$(check_url store "$APP_URL/")"
  api_report="$(check_url api "$STATUS_URL")"
  discord_report="$api_report"
  minecraft_report="$api_report"
  if grep -q '"discordOnline":true' /tmp/monitor-api.json 2>/dev/null; then
    discord_report='{"serviceKey":"discord","status":"ONLINE","latencyMs":0,"message":"Snapshot Discord atualizado"}'
  else
    discord_report='{"serviceKey":"discord","status":"DEGRADED","latencyMs":0,"message":"Snapshot Discord sem confirmação online"}'
  fi
  if grep -q '"minecraftStatus":"ONLINE"' /tmp/monitor-api.json 2>/dev/null; then
    minecraft_report='{"serviceKey":"minecraft","status":"ONLINE","latencyMs":0,"message":"Paper reportado online"}'
  else
    minecraft_report='{"serviceKey":"minecraft","status":"OFFLINE","latencyMs":0,"message":"Paper sem confirmação online"}'
  fi
  payload="{\"reports\":[${store_report},${api_report},${discord_report},${minecraft_report}]}"
  curl --silent --show-error --max-time 20 -X POST "$REPORT_URL" -H "content-type: application/json" -H "x-maintenance-secret: $SECRET" --data "$payload" >/dev/null 2>&1 || true
  sleep "$INTERVAL"
done
