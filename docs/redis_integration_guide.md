# Руководство по работе с Redis

## 1. Быстрый старт

```bash
# Production
docker compose up -d redis backend

# Development (hot reload)
docker compose -f docker-compose.dev.yaml up -d redis backend
```

- Проверка здоровья сервиса: `docker exec redis redis-cli ping` (prod) или `docker exec redis-dev redis-cli ping` (dev).
- Логи: `docker compose logs -f redis`.

## 2. Конфигурация окружения

Параметры задаются через `.env` (или переменные среды CI):

| Переменная | Назначение | Значение по умолчанию |
|------------|------------|------------------------|
| `REDIS__ENABLED` | Включить/выключить использование Redis | `true` |
| `REDIS__HOST` / `REDIS__PORT` / `REDIS__DB` | Подключение к Redis | `redis` / `6379` / `0` |
| `REDIS__PASSWORD` | Пароль (если требуется) | *(пусто)* |
| `REDIS__SESSION_PREFIX` | Namespace для сессий | `session` |
| `REDIS__SESSION_TTL_SECONDS` | TTL сессий (сек) | `3600` |
| `REDIS__CACHE_PREFIX` | Namespace для кеша | `cache` |
| `REDIS__CACHE_DEFAULT_TTL_SECONDS` | Базовый TTL кеша | `300` |
| `REDIS__PROFILE_CACHE_TTL_SECONDS` | TTL кеша профиля | `900` |

## 3. Проверка функциональности

1. **Регистрация пользователя** — создать аккаунт → профиль должен появиться в Redis (`KEYS cache:profile:email*`).
2. **Повторный логин** — удостовериться, что предыдущие сессии инвалидируются (`SMEMBERS session:user:<uuid>`).
3. **Обновление доступных запусков** — вызвать `update_count_attempts`; кэшированный профиль обновится без повторных запросов к БД.

## 4. Отключение Redis (fallback)

```bash
export REDIS__ENABLED=false
docker compose up -d --force-recreate backend
```

- DI контейнер пропустит инициализацию Redis, сервисы вернутся к работе только с PostgreSQL.
- Кеш и сессии в Redis сохранятся, но не будут читаться (для миграций без потери данных).

## 5. Траблшутинг

| Проблема | Диагностика | Решение |
|----------|-------------|---------|
| Backend не стартует, ошибка подключения | `docker compose logs backend` | Проверьте `REDIS__HOST/PORT`, убедитесь что `redis` контейнер запущен |
| Ключи не появляются | Проверить `REDIS__ENABLED`, логи Auth/Profile сервисов (`docker compose logs backend`) | Убедитесь, что Redis включён и TTL > 0 |
| Redis заполняется «мусорными» ключами | `redis-cli --scan --pattern 'cache:*'` | Очистите через `redis-cli FLUSHDB` (dev) или настройте `maxmemory-policy` |

## 6. Дополнительные команды

```bash
# Удалить все ключи (dev!)
docker exec redis-dev redis-cli FLUSHALL

# Просмотреть активные соединения
redis-cli CLIENT LIST

# Мониторинг в реальном времени
redis-cli MONITOR
```
