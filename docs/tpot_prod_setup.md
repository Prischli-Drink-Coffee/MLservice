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
- Create a dashboard showing:
  - Worker memory usage over time (alert on >80% of configured `TPOT__MEMORY_LIMIT_MB`).
  - Task throughput and average duration.
  - Number of failures / restarting workers.

## Entrypoint best-practices
- Backend must handle scheduler absence gracefully and either retry or fall back to local mode. Example shell wait-loop provided in `docs/tpot_playbook.md`.

## Resource sizing guidance
- Small dev: 2 workers x 1 thread, 2GB per worker.
- Staging: 4 workers x 1 thread, 4GB per worker.
- Production: depends on dataset size and concurrency; benchmark and scale horizontally.

## Security
- Run workers/scheduler inside isolated network namespaces.
- Limit RBAC and network egress if running in k8s.

## Rollout plan (summary)
1. Deploy scheduler with 1 worker in staging and set `TPOT_PARALLEL_MODE=distributed`.
2. Run canary jobs (10% of runs) for 48h and monitor memory/latency.
3. Gradually scale workers and increase job share.
