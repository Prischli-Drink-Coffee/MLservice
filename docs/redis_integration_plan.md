# План интеграции Redis

**Статус:** ✅ Завершено
**Приоритет:** Высокий — требуется для production-ready авторизации и кеша профилей
**Дата завершения:** 2025-??-??

---

## 1. Цель

Внедрить Redis как единый слой для:

- хранения активных пользовательских сессий (моментальное закрытие/отзыв token'ов),
- кеширования пользовательских профилей (снижение нагрузки на PostgreSQL),
- дальнейшего масштабирования in-memory механик (rate limiting, очереди и т.п.).

## 2. Предыдущее состояние

- Сессии целиком лежали в PostgreSQL → отзыв токена занимал до 1 запроса к БД на каждое действие.
- ProfileService каждый раз ходил в БД → лишняя нагрузка при частом доступе.
- В docker-compose отсутствовал Redis, конфигурация в сервисе не предусматривала использование кеша.

## 3. Целевая архитектура

```text
FastAPI (backend)
 ├─ AuthService ─┬─ AuthRepository (PostgreSQL)
 │               └─ RedisSessionStore (Redis)
 └─ ProfileService ── ProfileRepository (PostgreSQL) + RedisCacheService (Redis)
```

- Настройки Redis управляются через `RedisConfig` в `service/settings.py`.
- Клиент реализован в `service/infrastructure/cache/redis_manager.py`.
- Сервисные обёртки:
  - `RedisSessionStore` — TTL, инвалидация, индексы по user/token.
  - `RedisCacheService` — неймспейсы, JSON-сериализация, TTL по профилям.
- DI контейнер (`service/container.py`) инициализирует Redis и передаёт зависимости в Auth/Profile сервисы.

## 4. Этапы реализации

| Этап | Содержание | Статус |
|------|------------|--------|
| 1. Инфраструктура | Добавить Redis в зависимости (`pyproject.toml`, `requirements.txt`), определить `RedisConfig` | ✅ |
| 2. Сервисный слой | Реализовать `RedisManager`, `RedisCacheService`, `RedisSessionStore`; обновить DI контейнер | ✅ |
| 3. Бизнес-логика | Обновить `AuthRepository` и `ProfileService` для работы с Redis (кеш, инвалидация) | ✅ |
| 4. Инфра-конфиг | Обновить `docker-compose*.yaml`, `.env`, `run.sh`, документацию | ✅ |
| 5. Тестирование | Добавить unit-тесты на кеш профиля, прогнать pytest | ✅ |

## 5. Тестирование

- `pytest backend/tests/test_profile_service_cache.py`
- Проверка запуска контейнеров: `docker compose up backend redis` и health-check `redis-cli ping`
- smoke-тесты логина/регистрации (ручные) → подтверждение, что сессии сохраняются и инвалидируются.

## 6. Потенциальные риски и follow-up

- Нагрузка: требуется мониторинг Redis (auth/session TTL, memory usage) → добавить метрики/alerts.
- Фолбэк: предусмотреть graceful degrade при отключении Redis (сейчас уже отключается через `REDIS__ENABLED`).
- Репликация/HA: для production стоит настроить внешний Redis Cluster / managed Redis (AWS ElastiCache etc.).
- Доп. кеши: в будущем можно кешировать счётчики джобов/файлов по аналогии с профилями.
