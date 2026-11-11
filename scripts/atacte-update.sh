#!/bin/sh
# Applies a server update requested by the manager through update.request.
# Installed by install.sh and executed from the user's crontab, never from the
# API container.
set -eu
umask 022

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INSTALL_DIR="$SCRIPT_DIR"
UPDATE_DIR="$INSTALL_DIR/update"
REQUEST="$UPDATE_DIR/update.request"
STATE="$UPDATE_DIR/update-state.json"
LOG="$UPDATE_DIR/update.log"
LOCK="$UPDATE_DIR/update.lock"

compose() {
  docker compose --project-name atacte --project-directory "$INSTALL_DIR" -f "$INSTALL_DIR/docker-compose.yml" "$@"
}

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$LOG"
}

write_state() {
  status="$1"
  version="$2"
  printf '{"status":"%s","version":"%s","updatedAt":"%s"}\n' \
    "$status" "$version" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATE.tmp"
  chmod 0644 "$STATE.tmp"
  mv "$STATE.tmp" "$STATE"
}

fail() {
  version="$1"
  write_state error "$version"
  log "update failed"
  exit 1
}

[ -s "$REQUEST" ] || exit 0

if [ -f "$INSTALL_DIR/.env" ] && grep -q '^AUTO_UPDATE=false' "$INSTALL_DIR/.env"; then
  log "ignoring update request because AUTO_UPDATE=false"
  rm -f "$REQUEST"
  exit 0
fi

TAG=$(head -n 1 "$REQUEST" | tr -d '[:space:]')

case "$TAG" in
  latest | v[0-9]*.[0-9]*.[0-9]*) ;;
  *)
    log "ignoring invalid update request"
    rm -f "$REQUEST"
    write_state error ""
    exit 1
    ;;
esac

# A stale lock from an interrupted run shouldn't block updates forever.
if [ -d "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -prune -mmin +30 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null || true
  else
    exit 0
  fi
fi
if ! mkdir "$LOCK" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT HUP INT TERM

if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 1048576 ]; then
  mv "$LOG" "$LOG.1"
fi

write_state running "$TAG"
rm -f "$REQUEST"
log "starting update to $TAG"

compose pull backend front redis >> "$LOG" 2>&1 || fail "$TAG"
compose up -d --wait postgres redis >> "$LOG" 2>&1 || fail "$TAG"
compose run --rm --no-deps backend ./node_modules/.bin/prisma migrate deploy \
  --schema=src/infrastructure/prisma/schema.prisma >> "$LOG" 2>&1 || fail "$TAG"
compose up -d --no-build --remove-orphans >> "$LOG" 2>&1 || fail "$TAG"

healthy=0
attempt=0
while [ "$attempt" -lt 60 ]; do
  if compose exec -T backend curl -fsS http://127.0.0.1:3001/health >/dev/null 2>&1; then
    healthy=1
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done
[ "$healthy" -eq 1 ] || fail "$TAG"

write_state success "$TAG"
log "update to $TAG completed"
