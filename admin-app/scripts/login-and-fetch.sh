#!/usr/bin/env bash
set -euo pipefail

BASE="${ADMIN_URL:-http://127.0.0.1:3001}"
LOGIN="$BASE/api/admin-login"
ADMIN="$BASE/admin"
JAR="$(dirname "$0")/cookies.txt"

# 1) CSRF
CSRF="$(curl -s "$LOGIN" | jq -r '.csrf')"
if [ -z "$CSRF" ] || [ "$CSRF" = "null" ]; then
  echo "CSRF alınamadı: $LOGIN" >&2
  exit 1
fi

# 2) Login (send body via stdin to avoid exposing password in process args)
PASSWORD="${ADMIN_PASSWORD:-test}"
DATA="username=admin&password=$PASSWORD&csrf=$CSRF"
printf '%s' "$DATA" | curl -i -c "$JAR" -H "Content-Type: application/x-www-form-urlencoded" \
  -X POST --data-binary @- "$LOGIN" | grep -i '^location:' || true

# 3) /admin
curl -i -b "$JAR" "$ADMIN" | sed -n '1,/^$/p'
