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
        echo "Skipping database migrations for now..."
        # alembic -c /dude/alembic/alembic.ini upgrade head || {
        #     echo "Alembic migration failed" >&2
        #     exit 1
        # }
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

    "node-worker")
        echo "Starting distributed node worker ..."
        exec python -m service.workers.run_node_worker
        ;;

    "node-result-listener")
        echo "Starting node result listener ..."
        exec python -m service.workers.run_node_result_listener
        ;;

    *)
        echo "Unknown command: $1" >&2
        exit 1
        ;;

esac
