#!/bin/sh
set -eu

RELEASE_REF="${ATACTE_RELEASE_REF:-main}"
REPOSITORY="${ATACTE_REPOSITORY:-https://raw.githubusercontent.com/ferforastieri/atacte/$RELEASE_REF}"
INSTALL_DIR="${ATACTE_DIR:-${HOME:-.}/.atacte}"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.yml"
UPDATER_DIR="$INSTALL_DIR/updater"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker Engine não encontrado ou indisponível para este usuário." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 não encontrado." >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR" "$UPDATER_DIR"
ENV_FILE="$INSTALL_DIR/.env"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"
tmp="$INSTALL_DIR/.atacte-download.$$"
trap 'rm -f "$tmp"' EXIT HUP INT TERM
download() {
  curl --fail --silent --show-error --location --retry 3 --connect-timeout 10 --max-time 60 "$1" -o "$tmp"
  mv "$tmp" "$2"
}

download "$REPOSITORY/docker-compose.yml" "$COMPOSE_FILE"
for file in Dockerfile go.mod go.sum main.go; do
  download "$REPOSITORY/updater/$file" "$UPDATER_DIR/$file"
done

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
if ! grep -q '^UPDATER_TOKEN=[^[:space:]]' "$ENV_FILE" 2>/dev/null; then
  umask 077
  printf '%s\n' "UPDATER_TOKEN=$(random_hex 32)" >> "$ENV_FILE"
  echo "Gerado token exclusivo do updater em $ENV_FILE."
fi

compose() {
  docker compose --project-directory "$INSTALL_DIR" -f "$COMPOSE_FILE" "$@"
}

# Backend e frontend são artefatos publicados no GHCR. O instalador não baixa
# o código-fonte nem os Dockerfiles deles, portanto nunca deve tentar compilá-los.
compose pull postgres backend front

# O updater é pequeno e seu contexto é baixado acima. Gere somente essa imagem
# local antes de subir a stack; assim --no-build não depende de uma imagem ausente.
compose build --pull updater
compose up -d --no-build --remove-orphans
echo "Atacte instalado/atualizado em http://localhost:${FRONT_PORT:-3456}"
echo "Arquivos preservados em $INSTALL_DIR (o volume PostgreSQL não é alterado)."
