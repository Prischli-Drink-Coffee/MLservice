#!/usr/bin/env bash

case "$1" in
    "bash")
        echo "Starting bash ..."
        exec bash -c "$2"
        ;;

    "zombie")
        echo "Starting zombie ..."
        exec tail -f /dev/null
        ;;


    "server")
        echo "Starting server ..."
        echo "Running database migrations (alembic upgrade head)"
        if ! alembic -c /dude/alembic/alembic.ini upgrade head; then
            echo "Alembic migration failed" >&2
            exit 1
        fi
        # Enable reload in dev if requested
        RELOAD_ARGS=""
        if [ "${SERVICE_DEBUG}" = "1" ] || [ "${UVICORN_RELOAD}" = "1" ]; then
            echo "Starting in reload mode"
            RELOAD_ARGS="--reload"
        fi
        # Use direct app import for reload compatibility
        exec python -m uvicorn service.main:app \
            --host 0.0.0.0 \
            --port ${SERVICE_SERVER_PORT:-8000} \
            --workers ${UVICORN_WORKERS:-1} \
            --proxy-headers \
            ${RELOAD_ARGS}
        ;;

    *)
        echo "Unknown command: $1" >&2
        exit 1
        ;;

esac
