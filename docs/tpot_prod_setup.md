# TPOT Production Setup

This document contains practical production recommendations for running TPOT AutoML at scale.

## Docker / Compose
Use `docker-compose.tpot.yml` (included in repo) to deploy a Dask scheduler + workers. Key points:

- Use small `nthreads` per worker (1) and run multiple workers (replicas). This enables per-evaluation isolation and easier memory control.
- Always set `TPOT__MEMORY_LIMIT_MB` for TPOT to avoid uncontrolled memory use.
- Mount a shared volume for `/var/run/tpot` so `scheduler.json` is visible to workers and backend.
- Healthchecks: ensure scheduler writes `scheduler.json` and workers can connect.

## K8s / Helm notes
If deploying on Kubernetes, prefer a StatefulSet/Deployment for workers and a Deployment for scheduler. Use resource requests/limits and a PersistentVolume for the scheduler file (or use a small init container to copy scheduler endpoint to a shared location). Use a readiness probe that checks `dask-scheduler` port (default 8786) or `/status` endpoints.

Example readiness probe snippet for K8s:

```yaml
readinessProbe:
  httpGet:
    path: /status
    port: 8787
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

## Prometheus / Dask monitoring
- Dask exposes Prometheus metrics when run with the dashboard; metrics endpoint typically at `http://<scheduler-host>:8787/status` and `/metrics` path for workers.
- Add a scrape job in Prometheus config:

```yaml
scrape_configs:
  - job_name: 'dask'
    static_configs:
      - targets: ['tpot-scheduler:8787']
    metrics_path: '/metrics'
    scheme: 'http'
    scrape_interval: 15s
```

- Useful metrics:
  - `dask_worker_memory_used_bytes`
  - `dask_worker_nthreads`
  - `dask_scheduler_tasks_total`
  - `dask_worker_status`

## Grafana
# TPOT Production Setup

Практические рекомендации по запуску TPOT в production/стейджинг окружении. В документе учтены последние изменения: сборка образа с setuptools, логирование снимков scheduler_info и рекомендации по доставке проектного кода на воркеры.

## Docker / Compose

Используйте `docker-compose.tpot.yml` для деплоя Dask scheduler + workers. Ключевые рекомендации:

- Используйте небольшое число потоков на worker (рекомендуется 1) и увеличивайте число реплик воркеров для горизонтального масштабирования.
- Всегда указывайте `TPOT__MEMORY_LIMIT_MB`, чтобы контролировать память на оценку модели.
- Смонтируйте общий том для `/var/run/tpot`, чтобы `scheduler.json` был доступен backend и worker'ам.
- В образ воркера включите проектный код (COPY) и setuptools — это минимизирует риски десериализации/ImportError.

## K8s / Helm notes

Если деплоите в Kubernetes, используйте Deployment/StatefulSet и PV для обмена `scheduler.json` или применяйте сервисную регистрацию. Настройте ресурсы и readinessProbe для scheduler/worker.

Пример readiness probe:

```yaml
readinessProbe:
  httpGet:
    path: /status
    port: 8787
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

## Prometheus / Dask monitoring

- Убедитесь, что Dask dashboard/metrics доступны и добавьте их в scrape_configs Prometheus.
- Важные метрики:
  - `dask_worker_memory_used_bytes`
  - `dask_worker_nthreads`
  - `dask_scheduler_tasks_total`
  - `dask_worker_status`

Также собирайте метрики TrainingService: `training_duration_seconds{mode="tpot"}`, `training_best_score` и `tpot_parallel_fallbacks_total`.

## Grafana

- Панель должна показывать загрузку памяти воркеров, число задач, среднюю длительность задач и частоту рестартов nanny.

## Entrypoint best-practices

- Backend должен уметь ждать появления `scheduler.json` и корректно реконнектиться или переходить в локальный режим.
- В `tpot_trainer` добавлены снимки состояния scheduler (pre-fit / on-exception) — сохраняются в /tmp и могут собираться в host `tmp_tpot/` для постмортема.

## Resource sizing guidance

- Small dev: 2 workers x 1 thread, 2GB per worker.
- Staging: 4 workers x 1 thread, 4GB per worker.
- Production: тестируйте и масштабируйте горизонтально, опираясь на реальную длительность и память оценок.

## Security

- Изолируйте network namespace scheduler/worker'ов, ограничьте egress/ingress в prod.

## Rollout plan (summary)

1. Deploy scheduler + 1 worker в staging, `TPOT_PARALLEL_MODE=distributed`.
2. Прогоните canary jobs (10% = небольшая доля) в течение 48h; мониторьте memory & task failures.
3. Если стабильно — увеличивайте число worker'ов и долю production jobs.

---

Примечание: для быстрой локальной проверки используйте `backend/tools/tpot_trainer_smoke_minimal_local.py` и `backend/tests/test_tpot_smoke_local.py` в CI как быстрый smoke.
