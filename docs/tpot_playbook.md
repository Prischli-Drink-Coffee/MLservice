# TPOT Playbook — DevOps snippets

This playbook contains practical snippets to run TPOT in `local` and `distributed` modes using Docker Compose and small operational notes.

## 1) Local dev (quick)

Use this when you want to test TPOT locally without Dask.

- Ensure `.env` contains:

```ini
ENABLE_AUTOML=true
TPOT_PARALLEL_MODE=local
TPOT__CONFIG_DICT='linear'
TPOT__N_JOBS=2
TPOT__MEMORY_LIMIT_MB=2048
```

- Start backend (dev compose):

```bash
docker compose -f docker-compose.dev.yaml up --build backend
```

Notes
- Local TPOT will use `n_jobs` for parallelism. Keep `TPOT__N_JOBS` modest to avoid OOM.

## 2) Distributed (Dask scheduler + workers)

Add the following services to `docker-compose.dev.yaml` (or `docker-compose.yaml` for staging):

```yaml
  tpot-scheduler:
    image: daskdev/dask:2024.5.2
    command: dask-scheduler --scheduler-file /var/run/tpot/scheduler.json --idle-timeout 600
    volumes:
      - ./infra/monitoring:/var/run/tpot
    networks:
      - backend

  tpot-worker:
    image: daskdev/dask:2024.5.2
    depends_on:
      - tpot-scheduler
    command: /bin/bash -lc "DASK_DISTRIBUTED__WORKER__DAEMON=False dask-worker --nthreads 1 --memory-limit 0 --scheduler-file /var/run/tpot/scheduler.json"
    volumes:
      - ./infra/monitoring:/var/run/tpot
    deploy:
      replicas: 2
    networks:
      - backend
```

- Expose `TPOT__DASK_SCHEDULER_FILE=/var/run/tpot/scheduler.json` to the backend container so it can connect using `Client(scheduler_file=...)`.
- When using `distributed` mode set `TPOT_PARALLEL_MODE=distributed` and ensure `TPOT__N_JOBS` matches number of worker processes.

## 3) Entrypoint wait helper (backend)

Dask scheduler writes `scheduler.json` after starting. Backend should wait for file presence before using it (or handle connection failure gracefully). Example shell snippet for entrypoint:

```bash
#!/usr/bin/env bash
set -e
if [ "$TPOT_PARALLEL_MODE" = "distributed" ]; then
  echo "Waiting for Dask scheduler file $TPOT__DASK_SCHEDULER_FILE"
  retries=0
  while [ $retries -lt 30 ]; do
    if [ -f "$TPOT__DASK_SCHEDULER_FILE" ]; then
      echo "Found scheduler file"
      break
    fi
    sleep 1
    retries=$((retries + 1))
  done
fi
# start backend
exec uvicorn service.main:app --host 0.0.0.0 --port 8000
```

## 4) Resource recommendations

- For small dev runs: 2 workers, 1 thread each, memory_limit ~ 2GB per worker.
- For staging: 4+ workers depending on workload.
- Always set `TPOT__MEMORY_LIMIT_MB` to limit memory per evaluation.

## 5) Troubleshooting

- "Can't connect to scheduler": check volume mount for `/var/run/tpot` and permissions.
- `Worker process died`: likely OOM, reduce `n_jobs` or increase `TPOT__MEMORY_LIMIT_MB`.
- Long evaluations: reduce `TPOT__POPULATION_SIZE` or `TPOT__GENERATIONS`, or set `TPOT__PER_RUN_LIMIT`.

## 6) Quick sanity checks

From within backend container:

```bash
python - <<'PY'
from dask.distributed import Client
c = Client(scheduler_file='/var/run/tpot/scheduler.json')
print(c)
PY
```

This verifies connectivity to scheduler.

---

Keep this playbook with ops docs and update versions/images and resource recommendations based on production observations.
