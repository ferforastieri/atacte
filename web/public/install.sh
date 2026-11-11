#!/bin/sh
set -eu
umask 077

RELEASE_REF="${ATACTE_RELEASE_REF:-main}"
REPOSITORY="${ATACTE_REPOSITORY:-https://raw.githubusercontent.com/ferforastieri/atacte/$RELEASE_REF}"
INSTALL_DIR="${ATACTE_DIR:-${HOME:-.}/.atacte}"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker Engine não encontrado ou indisponível para este usuário." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 não encontrado." >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/update"
# The backend container writes the update request/state files here. The host
# updater (run from this user's crontab) consumes them.
chmod 0777 "$INSTALL_DIR/update"
ENV_FILE="$INSTALL_DIR/.env"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"
tmp="$INSTALL_DIR/.atacte-download.$$"
trap 'rm -f "$tmp"' EXIT HUP INT TERM
download() {
  curl --fail --silent --show-error --location --retry 3 --connect-timeout 10 --max-time 60 "$1" -o "$tmp"
  mv "$tmp" "$2"
}


compose() {
  docker compose --project-name atacte --project-directory "$INSTALL_DIR" -f "$COMPOSE_FILE" "$@"
}

download "$REPOSITORY/docker-compose.yml" "$COMPOSE_FILE"

random_hex() {
  od -An -N"$1" -tx1 /dev/urandom | tr -d ' \n'
}
ensure_secret() {
  key="$1"
  bytes="$2"
  if ! grep -q "^${key}=[^[:space:]]" "$ENV_FILE" 2>/dev/null; then
    printf '%s=%s\n' "$key" "$(random_hex "$bytes")" >> "$ENV_FILE"
    echo "Gerado segredo local: $key"
  fi
}

ensure_secret POSTGRES_PASSWORD 32
ensure_secret JWT_SECRET 32
ensure_secret ENCRYPTION_KEY 16
if ! grep -q '^COOKIE_SECURE=' "$ENV_FILE" 2>/dev/null; then
  printf '%s\n' 'COOKIE_SECURE=false' >> "$ENV_FILE"
  echo "Instalação local HTTP: COOKIE_SECURE=false (ative HTTPS antes de expor o serviço)."
fi
if ! grep -q '^CORS_ORIGIN=' "$ENV_FILE" 2>/dev/null; then
  printf 'CORS_ORIGIN=http://localhost:%s\n' "${FRONT_PORT:-3456}" >> "$ENV_FILE"
fi
# Pinned images are a deliberate choice; do not replace them automatically.
if { grep -q '^BACKEND_IMAGE=' "$ENV_FILE" 2>/dev/null || grep -q '^FRONT_IMAGE=' "$ENV_FILE" 2>/dev/null; } \
  && ! grep -q '^AUTO_UPDATE=' "$ENV_FILE" 2>/dev/null; then
  printf '%s\n' 'AUTO_UPDATE=false' >> "$ENV_FILE"
  echo "Imagens fixadas no .env: atualização automática desativada."
fi


# Todos os serviços são artefatos publicados. O instalador baixa somente o
# Compose e nunca depende do código-fonte ou de Dockerfiles no servidor.
compose pull postgres redis backend front
compose up -d --wait postgres redis
compose run --rm --no-deps backend ./node_modules/.bin/prisma migrate deploy --schema=src/infrastructure/prisma/schema.prisma
compose up -d --no-build --remove-orphans
echo "Atacte instalado/atualizado em http://localhost:${FRONT_PORT:-3456}"
echo "Arquivos preservados em $INSTALL_DIR (o volume PostgreSQL não é alterado)."

# The manager can request an update; the host runs the same pull/migrate flow
# from this user's crontab, outside the API container and without a Docker
# socket exposed to the application.
UPDATE_SCRIPT="$INSTALL_DIR/atacte-update.sh"
if download "$REPOSITORY/scripts/atacte-update.sh" "$UPDATE_SCRIPT"; then
  chmod 0755 "$UPDATE_SCRIPT"
  if command -v crontab >/dev/null 2>&1; then
    current_crontab="$(crontab -l 2>/dev/null || true)"
    update_line="* * * * * PATH=/usr/local/bin:/usr/bin:/bin \"$UPDATE_SCRIPT\" >/dev/null 2>&1"
    if [ -n "$current_crontab" ]; then
      filtered="$(printf '%s\n' "$current_crontab" | grep -F -v 'atacte-update.sh' || true)"
    else
      filtered=""
    fi
    if [ -n "$filtered" ]; then
      printf '%s\n%s\n' "$filtered" "$update_line" | crontab - || cron_ok=0
    else
      printf '%s\n' "$update_line" | crontab - || cron_ok=0
    fi
    if [ "${cron_ok:-1}" -eq 1 ]; then
      : > "$INSTALL_DIR/update/updater.enabled"
      chmod 0644 "$INSTALL_DIR/update/updater.enabled"
      echo "Atualização automática habilitada (verificação a cada minuto via cron)."
    else
      rm -f "$INSTALL_DIR/update/updater.enabled"
      echo "Aviso: não foi possível registrar a atualização automática no cron." >&2
    fi
  else
    rm -f "$INSTALL_DIR/update/updater.enabled"
    echo "Aviso: cron não encontrado; a atualização automática pelo manager ficará indisponível." >&2
  fi
else
  rm -f "$INSTALL_DIR/update/updater.enabled"
  echo "Aviso: não foi possível instalar o executor de atualizações." >&2
fi

echo "Na primeira instalação: docker compose --project-directory $INSTALL_DIR exec backend npm run security:allow-registration -- SEU_EMAIL"
echo "Entre com email e senha."
