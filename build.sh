#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

echo "=== Build: Stack ==="

# Load .env if present
if [[ -f "$ENV_FILE" ]]; then
    while IFS='=' read -r key value; do
        if [[ -n $key && $key != '#'* ]]; then
            key=$(echo "$key" | tr -d '\r')
            value=$(echo "$value" | tr -d '\r')
            export "$key"="$value"
        fi
    done < "$ENV_FILE"
else
    echo "[warn] .env not found, creating a minimal one with defaults..."
    cat > "$ENV_FILE" <<'EOF'
# Minimal defaults for local use
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=telerag
POSTGRES_PORT=5432
NGINX_PORT=8080
# Uncomment to override frontend API base in prod build (otherwise relative '/')
# REACT_APP_API_BASE_URL=
EOF
    echo "[info] Created .env with basic defaults at $ENV_FILE"
    # export defaults
    export POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=telerag POSTGRES_PORT=5432 NGINX_PORT=8080
fi

# Determine compose file based on MODE (dev/prod)
MODE="${MODE:-prod}"
if [[ "$MODE" == "dev" ]]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yaml"
    echo "[mode] development"
else
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yaml"
    echo "[mode] production"
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE_BIN="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker-compose"
else
    echo "[error] docker compose/docker-compose is not installed"
    exit 1
fi

echo "[step] Building Docker images using $COMPOSE_FILE ..."
# Build only images that require building
if [[ "$MODE" == "dev" ]]; then
        $COMPOSE_BIN -f "$COMPOSE_FILE" build backend frontend
else
    # In prod, pass REACT_APP_API_BASE_URL to frontend via env (compose already wires args)
    echo "[info] Frontend REACT_APP_API_BASE_URL='${REACT_APP_API_BASE_URL:-}' (empty => relative '/')"
        $COMPOSE_BIN -f "$COMPOSE_FILE" build --build-arg APP_TAG="$APP_TAG" backend frontend
fi

echo "[step] Cleaning dangling images (optional) ..."
docker image prune -f >/dev/null 2>&1 || true
docker system prune -f >/dev/null 2>&1 || true

echo "--- Build completed successfully ---"
