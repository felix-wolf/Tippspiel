#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_TARGET="${1:-${DEPLOY_SSH_TARGET:-}}"
DEPLOY_REMOTE_PATH="${DEPLOY_REMOTE_PATH:-/var/www/tippspiel}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
CONTROL_PATH="/tmp/tf-%C"

if [[ -z "${DEPLOY_TARGET}" ]]; then
  cat <<'EOF'
Usage: ./deploy_frontend_remotely.sh <user@host>

Environment variables:
  DEPLOY_SSH_TARGET   Default SSH target if no argument is given
  DEPLOY_REMOTE_PATH  Remote deploy path (default: /var/www/tippspiel)
  DEPLOY_SSH_PORT     SSH port (default: 22)
  DEPLOY_SSH_KEY      Optional SSH private key path
EOF
  exit 1
fi

SSH_OPTS=(
  -p "${DEPLOY_SSH_PORT}"
  -o ControlMaster=auto
  -o ControlPersist=5m
  -o ControlPath="${CONTROL_PATH}"
)

SCP_OPTS=(
  -P "${DEPLOY_SSH_PORT}"
  -o ControlMaster=auto
  -o ControlPersist=5m
  -o ControlPath="${CONTROL_PATH}"
)

if [[ -n "${DEPLOY_SSH_KEY}" ]]; then
  SSH_OPTS+=(-i "${DEPLOY_SSH_KEY}")
  SCP_OPTS+=(-i "${DEPLOY_SSH_KEY}")
fi

cleanup() {
  ssh "${SSH_OPTS[@]}" -O exit "${DEPLOY_TARGET}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "${SCRIPT_DIR}"

# Reuse a single authenticated SSH session for all remote operations.
ssh "${SSH_OPTS[@]}" -fN "${DEPLOY_TARGET}"

# Run backend tests before deploying frontend.
(cd backend && uv run pytest -q)

git pull

cd frontend
npm install
npm run build

ssh "${SSH_OPTS[@]}" "${DEPLOY_TARGET}" "mkdir -p '${DEPLOY_REMOTE_PATH}/assets'"

# Keep the target in sync with the latest Vite build and remove stale hashed assets.
rsync -av --delete -e "ssh ${SSH_OPTS[*]}" dist/ "${DEPLOY_TARGET}:${DEPLOY_REMOTE_PATH}/"
scp "${SCP_OPTS[@]}" firebase-messaging-sw.js "${DEPLOY_TARGET}:${DEPLOY_REMOTE_PATH}/"
scp "${SCP_OPTS[@]}" src/assets/icons/icon-192x192.png "${DEPLOY_TARGET}:${DEPLOY_REMOTE_PATH}/assets/"
scp "${SCP_OPTS[@]}" src/assets/icons/icon-512x512.png "${DEPLOY_TARGET}:${DEPLOY_REMOTE_PATH}/assets/"
