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

# TPOT Playbook — DevOps snippets

Практические сниппеты и оперативные заметки для запуска TPOT в `local` и `distributed` режимах (Docker Compose). Добавлены примечания по последним изменениям в проекте.

## Важные обновления

- Образ воркера/планировщика должен содержать `setuptools` (в репозитории обновлён `backend/Dockerfile.tpot` для этого).
- В `backend/tools/` добавлены минимальные smoke-скрипты: локальная и распределённая версии. Используйте их для быстрой проверки после сборки образа.
- Для стабильной работы распределённого режима рекомендуется включить проектный код в образ воркера (COPY) — это устраняет частые ошибки десериализации/импорта.

## 1) Local dev (quick)

Use this when you want to test TPOT locally without Dask.

- Убедитесь, что в `.env` установлены значения:

```ini
ENABLE_AUTOML=true
TPOT_PARALLEL_MODE=local
TPOT__CONFIG_DICT='linear'
TPOT__N_JOBS=2
TPOT__MEMORY_LIMIT_MB=2048
```

- Запуск бэкенда в dev режиме:

```bash
docker compose -f docker-compose.dev.yaml up --build backend
```

Заметки:
- Local TPOT использует `n_jobs` для параллелизма. Держите `TPOT__N_JOBS` в разумных пределах, чтобы избежать OOM.

## 2) Distributed (Dask scheduler + workers)

Пример сервисов для `docker-compose` (стартовый шаблон):

```yaml
  tpot-scheduler:
    image: daskdev/dask:2024.5.2
    command: dask-scheduler --scheduler-file /var/run/tpot/scheduler.json --idle-timeout 600
    volumes:
      - ./infra/monitoring:/var/run/tpot
    networks:
      - backend

  tpot-worker:
    image: mlservice-dask-tpot:latest
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

- Передайте `TPOT__DASK_SCHEDULER_FILE=/var/run/tpot/scheduler.json` в контейнер backend, чтобы он мог подключиться через `Client(scheduler_file=...)`.
- Для distributed режима ставьте `TPOT_PARALLEL_MODE=distributed` и согласуйте `TPOT__N_JOBS` с количеством воркеров/процессов.

## 3) Entrypoint wait helper (backend)

Поскольку `dask-scheduler` пишет `scheduler.json` после старта, рекомендую в entrypoint делать ожидание файла (или ретраить подключение). Пример shell-обёртки (см. `backend/entrypoints.sh`):

```bash
#!/usr/bin/env bash
set -e
if [ "$TPOT_PARALLEL_MODE" = "distributed" ]; then
  echo "Waiting for Dask scheduler file $TPOT__DASK_SCHEDULER_FILE"
  retries=0
  while [ $retries -lt 60 ]; do
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

- Small dev: 2 workers, 1 thread each, memory_limit ~ 2GB per worker.
- Staging: 4+ workers depending on load.
- Всегда указывайте `TPOT__MEMORY_LIMIT_MB` для предсказуемости.

## 5) Troubleshooting

- "Can't connect to scheduler": проверьте монтирование тома для `/var/run/tpot` и права доступа.
- `Worker process died`: вероятно OOM — уменьшите `n_jobs` или увеличьте `TPOT__MEMORY_LIMIT_MB`.
- Ошибки десериализации/ImportError на воркерах: убедитесь, что в image воркера есть все зависимости и проектный код либо копируется в образ, либо загружается через `client.upload_file()`.

## 6) Quick sanity checks

В контейнере backend можно быстро проверить подключение к scheduler:

```bash
python - <<'PY'
from dask.distributed import Client
c = Client(scheduler_file='/var/run/tpot/scheduler.json')
print(c)
PY
```

---

Обновляйте инструкции по образам и ресурсам на основе наблюдений в staging/production.
