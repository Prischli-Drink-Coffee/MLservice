#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

echo "=== Run: TeleRAG Stack ==="

# Load .env if present, set minimal defaults if not
if [[ -f "$ENV_FILE" ]]; then
    while IFS='=' read -r key value; do
        if [[ -n $key && $key != '#'* ]]; then
            key=$(echo "$key" | tr -d '\r')
            value=$(echo "$value" | tr -d '\r')
            export "$key"="$value"
        fi
    done < "$ENV_FILE"
else
    echo "[warn] .env not found, using local defaults (see build.sh to scaffold one)."
    export POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=telerag POSTGRES_PORT=5432 NGINX_PORT=8080 PROMETHEUS_PORT=9090 GRAFANA_PORT=3001
fi

MODE="${MODE:-prod}"
if [[ "$MODE" == "dev" ]]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yaml"
    echo "[mode] development"
    REDIS_CONTAINER_NAME="redis-dev"
    PROMETHEUS_CONTAINER_NAME="prometheus-dev"
    GRAFANA_CONTAINER_NAME="grafana-dev"
else
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yaml"
    echo "[mode] production"
    REDIS_CONTAINER_NAME="redis"
    PROMETHEUS_CONTAINER_NAME="prometheus"
    GRAFANA_CONTAINER_NAME="grafana"
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE_BIN="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker-compose"
else
    echo "[error] docker compose/docker-compose is not installed"
    exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "[error] compose file not found: $COMPOSE_FILE"
    exit 1
fi

wait_for_container_health() {
    local name="$1"
    local timeout="${2:-60}"
    local i=0
    echo "[info] Waiting for container '$name' to be healthy (timeout ${timeout}s)..."
    while [[ $i -lt $timeout ]]; do
        status=$(docker inspect --format='{{json .State.Health.Status}}' "$name" 2>/dev/null || echo '"unknown"')
        if [[ "$status" == '"healthy"' ]]; then
            echo "[ok] $name is healthy"
            return 0
        fi
        sleep 2
        i=$((i+2))
    done
    echo "[warn] $name health check timed out after ${timeout}s"
    return 1
}

wait_for_kafka() {
    local container_name="kafka"
    local timeout="${1:-120}"
    local i=0
    echo "[info] Waiting for Kafka to be ready (timeout ${timeout}s)..."
    while [[ $i -lt $timeout ]]; do
        if docker exec "$container_name" bash -lc "kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1"; then
            echo "[ok] Kafka is ready"
            return 0
        fi
        sleep 2
        i=$((i+2))
    done
    echo "[warn] Kafka readiness timed out after ${timeout}s"
    return 1
}

echo "[step] Starting services..."
if [[ "$MODE" == "dev" ]]; then
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d postgres
    wait_for_container_health postgres 60 || true
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d redis
    wait_for_container_health "$REDIS_CONTAINER_NAME" 60 || true
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d backend
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d prometheus grafana
    FRONTEND_URL="http://localhost:3000"
    BACKEND_URL="http://localhost:8000/api"
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d frontend
else
    # Prod: start infra, wait for postgres, then backend, then frontend+nginx
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d postgres redis
    wait_for_container_health postgres 60 || true
    wait_for_container_health "$REDIS_CONTAINER_NAME" 60 || true
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d backend
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d prometheus grafana
    $COMPOSE_BIN -f "$COMPOSE_FILE" up -d frontend nginx
    FRONTEND_URL="http://localhost:${NGINX_PORT:-8080}"
    BACKEND_URL="$FRONTEND_URL/api"
fi

echo "[info] Waiting for backend health..."
if [[ "$MODE" == "dev" ]]; then
    TIMEOUT_SECS="${BACKEND_HEALTH_TIMEOUT:-180}"
else
    TIMEOUT_SECS="${BACKEND_HEALTH_TIMEOUT:-120}"
fi
DEADLINE=$(( $(date +%s) + TIMEOUT_SECS ))
while true; do
    if curl -fsS "${BACKEND_URL}/health" >/dev/null 2>&1; then
        echo "[ok] Backend is healthy"
        break
    fi
    if (( $(date +%s) >= DEADLINE )); then
        echo "[warn] Backend is not healthy after ${TIMEOUT_SECS}s"
        break
    fi
    sleep 2
done

echo "--- Services are up ---"
echo "Frontend:  $FRONTEND_URL"
echo "API docs:  ${BACKEND_URL}/docs"
echo "API health: ${BACKEND_URL}/health"
PROMETHEUS_URL="http://localhost:${PROMETHEUS_PORT:-9090}"
GRAFANA_URL="http://localhost:${GRAFANA_PORT:-3001}"
echo "Prometheus: $PROMETHEUS_URL"
echo "Grafana:    $GRAFANA_URL"
echo
echo "[tip] To view logs: $COMPOSE_BIN -f $COMPOSE_FILE logs -f --tail=200"
echo "[tip] To stop:      $COMPOSE_BIN -f $COMPOSE_FILE down --remove-orphans"
echo "[tip] To rebuild:   $COMPOSE_BIN -f $COMPOSE_FILE up -d --force-recreate frontend"
