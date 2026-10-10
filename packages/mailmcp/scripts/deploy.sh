#!/usr/bin/env bash
# Deploy a mailmcp instance to a Docker host over SSH: write .env, pull, rebuild, restart, health check.
#
# Usage:  scripts/deploy.sh <env-file> [instance-dir] [host-port]
#   env-file      local file with PUBLIC_URL, OWNER_EMAILS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#                 TOKEN_ENC_KEY, SESSION_SECRET (e.g. exported from your password/secrets manager;
#                 keep it outside any git repository and delete it afterwards)
#   instance-dir  directory on the host (default: mailmcp). One directory + port per family/instance.
#   host-port     127.0.0.1 port on the host that your tunnel points to (default: 2310)
# Environment:
#   MAILMCP_HOST  ssh target, e.g. user@docker-host (required)
#   MAILMCP_REPO  git URL the host clones the code from (required on first deploy)
#   MAILMCP_SUBDIR path of mailmcp inside that repo (default: packages/mailmcp, as in the Estate OS kit;
#                 set to "." if you deploy from a standalone mailmcp repository)
set -euo pipefail

ENV_FILE="${1:?env file required}"
DIR="${2:-mailmcp}"
HOST_PORT="${3:-2310}"
HOST="${MAILMCP_HOST:?set MAILMCP_HOST=user@host}"
SUBDIR="${MAILMCP_SUBDIR:-packages/mailmcp}"
APP="$DIR/$SUBDIR"
PROJECT="$(basename "$DIR")"   # compose project name -> separate containers and volumes per instance
VARS=(PUBLIC_URL OWNER_EMAILS GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET TOKEN_ENC_KEY SESSION_SECRET)

set -a; source "$ENV_FILE"; set +a
for v in "${VARS[@]}"; do
  [[ -n "${!v:-}" ]] || { echo "missing variable in $ENV_FILE: $v" >&2; exit 1; }
done

echo "→ ensuring checkout on $HOST:~/$DIR"
ssh "$HOST" "test -d ~/$DIR/.git || git clone -q ${MAILMCP_REPO:?set MAILMCP_REPO for the first deploy} ~/$DIR"

echo "→ writing .env (values sent over ssh stdin, never printed)"
{ for v in "${VARS[@]}"; do printf '%s=%s\n' "$v" "${!v}"; done; printf 'HOST_PORT=%s\n' "$HOST_PORT"; } |
  ssh "$HOST" "umask 077 && cat > ~/$APP/.env"

echo "→ pulling and rebuilding"
ssh "$HOST" "export PATH=/opt/homebrew/bin:/usr/local/bin:\$PATH; cd ~/$DIR && git pull -q --ff-only && cd ~/$APP && docker compose -p $PROJECT up -d --build && docker compose -p $PROJECT ps"

echo "→ health"
ssh "$HOST" "curl -fsS http://127.0.0.1:$HOST_PORT/healthz" && echo
