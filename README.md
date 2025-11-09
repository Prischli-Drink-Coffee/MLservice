# Запуск сервиса

## Dev запуск (горячая перезагрузка фронта и локальный API)

```bash
docker compose -f docker-compose.dev.yaml up --build
```

- Фронтенд: <http://localhost:3000>
- Бэкенд: <http://localhost:8000> (доки: <http://localhost:8000/api/docs>)
- Во время dev CORS разрешён для <http://localhost:3000>
- Postgres, Zookeeper и Kafka поднимаются локально в `docker-compose.dev`
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

### ML / Upload feature flags

- `ENABLE_REAL_TRAINING` — включает реальное обучение (pandas + scikit-learn + joblib). По умолчанию выключено (fallback лёгкий baseline). Любая ошибка heavy-пути приводит к автоматическому откату на лёгкий путь.
- `MAX_CSV_UPLOAD_BYTES` — лимит размера загружаемого CSV (по умолчанию `10485760` = 10 MiB). При превышении вернётся HTTP 413.
- `MIN_CSV_DATA_ROWS` — минимальное число строк данных (без заголовка), по умолчанию `2`.
- `MAX_EMPTY_RATIO` — максимальная доля пустых/`nan`/`null` ячеек (0..1), по умолчанию `0.5`.
- `MAX_MODEL_ARTIFACTS` — ретенция артефактов моделей на пользователя: хранится указанное число самых новых, старые удаляются из БД и файловой системы (по умолчанию `5`).

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
