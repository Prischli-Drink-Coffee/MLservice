# Запуск сервиса

## Dev запуск (горячая перезагрузка фронта и локальный API)
```
docker compose -f docker-compose.dev.yaml up --build
```

- Фронтенд: http://localhost:3000
- Бэкенд: http://localhost:8000 (доки: http://localhost:8000/api/docs)
- Во время dev CORS разрешён для http://localhost:3000
- Postgres, Zookeeper и Kafka поднимаются локально в docker-compose.dev
- Бэкенд стартует с auto-migrations (Alembic) и hot reload (`SERVICE_DEBUG=1`)

## Продакшен через Nginx (единая точка входа)
```
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

## Миграции БД (Alembic)
Из директории `/backend`:
```
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

## Быстрые подсказки
- Если фронт в dev не видит API, проверьте `REACT_APP_API_BASE_URL` в `docker-compose.dev.yaml` (должен быть `http://localhost:8000`).
