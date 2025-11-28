# Запуск сервиса

## Dev запуск (горячая перезагрузка фронта и локальный API)

```bash
docker compose -f docker-compose.dev.yaml up --build
```

- Фронтенд: <http://localhost:3000>
- Бэкенд: <http://localhost:8000> (доки: <http://localhost:8000/api/docs>)
- Во время dev CORS разрешён для <http://localhost:3000>
- Postgres, Redis и MinIO поднимаются локально в `docker-compose.dev`
- Бэкенд стартует с auto-migrations (Alembic) и hot reload (`SERVICE_DEBUG=1`)

## Продакшен через Nginx (единая точка входа)

```bash
docker compose up -d --build
```

- Веб-интерфейс и API доступны за Nginx на порту `${NGINX_PORT}` (по умолчанию 80)
- SPA отдаётся контейнером `frontend` (nginx), API проксируется как `/api/` на `backend`
- Healthchecks: `nginx` — `/health`, `backend` — `/api/health`

## Переменные окружения

См. `.env.example`. Критичные:

- `AUTH__SECRET` — секрет для JWT (обязательно сменить в продакшне)
- `POSTGRES_*` и `PG__*` — доступ к БД
- `CORS__ALLOW_ORIGINS` — JSON-массив доменов, напр.: `["https://app.example.com"]`
- `REACT_APP_API_BASE_URL` — используется на этапе build фронта для dev/внешних доменов. В проде лучше пусто (фронт ходит на относительный `/api`).

### Storage Backend

Платформа поддерживает два режима хранения файлов:

#### Local Storage (по умолчанию)

- Файлы хранятся в `infra/storage/` (Docker volume)
- Подходит для development и small-scale deployments
- Настройка: `STORAGE_BACKEND=local`

#### MinIO (рекомендовано для production)

- S3-совместимое объектное хранилище
- Presigned URLs для прямого скачивания (без нагрузки на backend)
- Horizontal scaling support
- Простое backup/restore

**Настройка MinIO**:

```bash
# В .env
STORAGE_BACKEND=minio
MINIO__ENDPOINT=minio:9000
MINIO__ACCESS_KEY=minioadmin
MINIO__SECRET_KEY=minioadmin
MINIO__BUCKET=mlops-files
MINIO__PUBLIC_ENDPOINT=http://localhost:9000

# Запуск
docker compose up -d minio backend

# MinIO Console: http://localhost:9001
```

📖 **Подробнее**: см. [docs/minio_migration_guide.md](docs/minio_migration_guide.md)

### Redis Cache & Sessions

Redis используется для хранения активных пользовательских сессий и кеширования профилей.

- В docker-compose сервис `redis` стартует автоматически (в dev — `redis-dev`).
- Настройка включена по умолчанию: `REDIS__ENABLED=true`.
- Основные переменные окружения (см. `.env`):
  - `REDIS__HOST`, `REDIS__PORT`, `REDIS__DB`
  - `REDIS__SESSION_PREFIX`, `REDIS__SESSION_TTL_SECONDS`
  - `REDIS__CACHE_PREFIX`, `REDIS__PROFILE_CACHE_TTL_SECONDS`
- Для отключения Redis выставьте `REDIS__ENABLED=false` и перезапустите backend.

📖 **Документация по интеграции**: `docs/redis_integration_plan.md`, `docs/redis_implementation_summary.md`, `docs/redis_integration_guide.md`.

### Monitoring & Observability

- Prometheus (`http://localhost:9090`) и Grafana (`http://localhost:3001`) поднимаются вместе с бэкендом как в prod, так и в dev-compose.
- Экспорт метрик включён по умолчанию (`PROMETHEUS__ENABLED=true`) и доступен на `http://localhost:8000/metrics`.
- Готовый Grafana дашборд «Backend Monitoring Overview» подключается автоматически; логин/пароль по умолчанию `admin/admin`.
- Основные переменные окружения: `PROMETHEUS__*` (namespace, путь, buckets), `PROMETHEUS_PORT`, `GRAFANA_PORT`, `GRAFANA_ADMIN_*`.
- Для отключения мониторинга задайте `PROMETHEUS__ENABLED=false` и перезапустите backend.

📖 **Документация**: `docs/prometheus_integration_plan.md`, `docs/prometheus_implementation_summary.md`, `docs/prometheus_integration_guide.md`.

### ML / Upload feature flags

- `ENABLE_REAL_TRAINING` — включает реальное обучение (pandas + scikit-learn + joblib). По умолчанию выключено (fallback лёгкий baseline). Любая ошибка heavy-пути приводит к автоматическому откату на лёгкий путь.
- `MAX_CSV_UPLOAD_BYTES` — лимит размера загружаемого CSV (по умолчанию `10485760` = 10 MiB). При превышении вернётся HTTP 413.
- `MIN_CSV_DATA_ROWS` — минимальное число строк данных (без заголовка), по умолчанию `2`.
- `MAX_EMPTY_RATIO` — максимальная доля пустых/`nan`/`null` ячеек (0..1), по умолчанию `0.5`.
- `MAX_MODEL_ARTIFACTS` — ретенция артефактов моделей на пользователя: хранится указанное число самых новых, старые удаляются из БД и файловой системы (по умолчанию `5`).

### TPOT AutoML (новое)

- `ENABLE_AUTOML` — включает использование TPOT для автоматического поиска моделей (feature-flag).
- `TPOT_PARALLEL_MODE` — `local` / `distributed` / `off` (по умолчанию `local`).
- `TPOT__CONFIG_DICT` — конфигурация TPOT: рекомендуется использовать строковые имена пространств поиска (`'linear'`, `'graph'`) или `tpot.config.get_search_space('regressors')`; для старых версий можно указать `module.attr` или literal dict.
- `TPOT__GENERATIONS`, `TPOT__POPULATION_SIZE`, `TPOT__TIME_LEFT`, `TPOT__PER_RUN_LIMIT`, `TPOT__METRIC` — стандартные параметры TPOT.

Пример включения в `.env`:

```ini
ENABLE_AUTOML=true
TPOT_PARALLEL_MODE=local
TPOT__CONFIG_DICT='linear'
TPOT__GENERATIONS=40
TPOT__POPULATION_SIZE=64
TPOT__TIME_LEFT=600
TPOT__PER_RUN_LIMIT=60
TPOT__METRIC=accuracy
```

Документация и плейбуки по TPOT:

- `docs/tpot_integration_plan.md` — план интеграции TPOT в pipeline и миграционные заметки.
- `docs/tpot_playbook.md` — пошаговый плейбук для запуска TPOT локально и на Dask.
- `docs/tpot_prod_setup.md` — рекомендации для продакшен-деплоя (ресурсы, Prometheus, Grafana).

Для установки всех необязательных зависимостей TPOT (тяжёлых пакетов для e2e/Dask) можно
выполнить:

```bash
pip install -r backend/requirements-tpot.txt
```

Файл `backend/requirements-tpot.txt` содержит версии пакетов, нужных для TPOT и распределённых запусков.


### ML API (v1) эндпоинты

- `GET /api/ml/v1/datasets` — список датасетов пользователя.
- `POST /api/ml/v1/datasets/upload` — загрузка CSV с валидацией (размер, заголовок, минимальные строки, пустые значения).
- `GET /api/ml/v1/training-runs` — последние запуски обучения.
- `GET /api/ml/v1/artifacts` — список модельных артефактов.
- `DELETE /api/ml/v1/artifacts/{artifact_id}` — удаление артефакта (запись + файл на диске). Возвращает `{id, deleted:true}`.

## Миграции БД (Alembic)

Из директории `/backend`:

```bash
docker compose exec backend bash -lc "alembic -c alembic/alembic.ini upgrade head"
```

Auto-migrations: контейнер бэкенда выполняет `upgrade head` при старте.

## Hot reload

В dev режиме бэкенд запущен с `uvicorn --reload` и экспортированным приложением `service.main:app`. Изменения в `backend/service/**` подхватываются автоматически.

## Архитектура связки

- Nginx (`infra/nginx`) проксирует `/api/` на `backend:8000` и остальное на `frontend:80`
- Фронтенд обращается к API по относительному пути (`/api/...`), а в dev — по `REACT_APP_API_BASE_URL=http://localhost:8000`

## Полезное

- Логи Nginx: `docker compose logs -f nginx`
- Логи бекенда: `docker compose logs -f backend`
- Логи фронта (runtime nginx): `docker compose logs -f frontend`

## CI

GitHub Actions workflow (`.github/workflows/backend-ci.yml`):

- Windows: прогон тестов с лёгким ML fallback (heavy выключен для стабильности).
- Ubuntu: прогон тестов с `ENABLE_REAL_TRAINING=1` для проверки heavy пути (pandas/sklearn).
- Сводный джоб завершает сборку при падении любой матрицы.

---

## Быстрые подсказки

- Если фронт в dev не видит API, проверьте `REACT_APP_API_BASE_URL` в `docker-compose.dev.yaml` (должен быть `http://localhost:8000`).
- Чтобы включить реальное обучение: добавьте `ENABLE_REAL_TRAINING=1` в окружение `backend` и убедитесь, что зависимости (numpy/pandas/scikit-learn) совместимы с вашей платформой.
- Контроль артефактов: настройте `MAX_MODEL_ARTIFACTS`, чтобы не захламлять БД.
