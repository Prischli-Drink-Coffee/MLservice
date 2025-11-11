# Руководство по интеграции и эксплуатации Prometheus + Grafana

## 1. Быстрый старт

1. Скопируйте `.env.example` → `.env` и при необходимости настройте порты/логины.
2. Запустите стек (prod):

   ```powershell
   docker compose up -d --build backend prometheus grafana
   ```

   Для режима разработки используйте `docker compose -f docker-compose.dev.yaml up --build` — сервисы Prometheus и Grafana также стартуют автоматически.
3. Проверьте состояние сервисов:

   ```powershell
   docker compose ps
   docker compose logs prometheus --tail 20
   docker compose logs grafana --tail 20
   ```

4. Откройте интерфейсы:
   - Prometheus: <http://localhost:9090>
   - Grafana: <http://localhost:3001> (логин/пароль по умолчанию `admin`/`admin` — измените перед продакшеном).

## 2. Проверка метрик

### 2.1 Backend endpoint

```powershell
# Вернёт текстовый вывод с метриками
curl http://localhost:8000/metrics
```

Убедитесь, что присутствуют префиксы `http_` от instrumentator и `mlops_backend_*` для доменных счётчиков.

### 2.2 Prometheus targets

1. Откройте Prometheus UI → `Status` → `Targets`.
2. Таргеты `backend` и `prometheus` должны иметь статус `UP`.
3. Для быстрых запросов используйте PromQL:
   - `rate(mlops_backend_dataset_uploads_total[5m])`
   - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`

### 2.3 Grafana Dashboard

1. В Grafana перейдите в `Dashboards` → «Backend Monitoring Overview».
2. По умолчанию дашборд обновляется каждые 30 секунд.
3. Карточки на дашборде:
   - **HTTP requests rate** — `http_requests_total` по handler'ам.
   - **Dataset uploads** — скорость загрузок по режимам (light/heavy).
   - **Training duration** — гистограммы p50/p95.
   - **Training outcomes** — сравнение success vs failure.

## 3. Настройка окружения

| Переменная | Назначение | Значение по умолчанию |
|------------|------------|------------------------|
| `PROMETHEUS__ENABLED` | Включить/выключить экспорт метрик | `true` |
| `PROMETHEUS__METRICS_PATH` | Путь до эндпоинта | `/metrics` |
| `PROMETHEUS__METRIC_NAMESPACE` | Namespace для метрик | `mlops` |
| `PROMETHEUS__METRIC_SUBSYSTEM` | Subsystem | `backend` |
| `PROMETHEUS__LATENCY_BUCKETS` | Кастомные buckets (JSON-массив) | `[0.005,...,10]` |
| `PROMETHEUS_PORT` | Хост-порт Prometheus | `9090` |
| `GRAFANA_PORT` | Хост-порт Grafana | `3001` |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | Учётные данные Grafana | `admin` / `admin` |

> ⚠️ При изменении `PROMETHEUS__METRICS_PATH` обновите `infra/monitoring/prometheus/prometheus.yml` и перезапустите Prometheus.

## 4. Пользовательские сценарии

### 4.1 Изменение адреса backend

Если backend запущен на другом хосте/порту:

1. Отредактируйте `infra/monitoring/prometheus/prometheus.yml` → `targets`.
2. Выполните `docker compose up -d prometheus` (перезапуск только Prometheus).

### 4.2 Расширение метрик

- Добавьте новые `Counter`/`Histogram` в `service/monitoring/metrics.py`.
- В нужном сервисе вызовите helper, оборачивая логику try/except при необходимости.
- Протестируйте локально через `curl /metrics` и убедитесь, что Prometheus видит новые серии (`rate(new_metric_total[5m])`).

### 4.3 Дополнительные дашборды

1. Скопируйте JSON в `infra/monitoring/grafana/dashboards/<folder>/`.
2. Обновите `infra/monitoring/grafana/provisioning/dashboards/dashboard.yml` (если добавляется новая папка) или импортируйте через UI.
3. Перезапустите Grafana или используйте «Load» в UI.

## 5. Troubleshooting

| Симптом | Возможная причина | Решение |
|---------|-------------------|---------|
| `/metrics` возвращает 404 | `PROMETHEUS__ENABLED=false` или неверный путь | Включите переменную, перезапустите backend |
| Prometheus target DOWN | Prometheus не видит backend | Проверьте `prometheus.yml`, сеть docker-compose, health backend |
| Grafana дашборд пустой | Нет данных в Prometheus или datasource не активирован | Откройте Prometheus → Graph, проверьте datasource UID в provisioning |
| Ошибки «permission denied» при старте | Нет прав на volume | Очистите `infra/monitoring/grafana`/`prometheus` или запустите с sudo |
| Дублирование метрик после hot-reload | Instrumentator инициализирован дважды | Убедитесь, что `setup_monitoring` вызывается один раз (есть защита в коде) |

## 6. Практики эксплуатации

- Храните Grafana dashboards и Datasource в git (уже реализовано).
- После первого логина смените `GRAFANA_ADMIN_PASSWORD` во избежание инцидентов.
- Настройте резервное копирование `prometheus-data` volume при продакшене.
- Регулярно проверяйте размер Prometheus TSDB, чтобы избежать переполнения диска.
- Для production рекомендуем вынести Prometheus/Grafana в отдельный профиль (`docker compose --profile monitoring`).

## 7. Связанные документы

- `docs/prometheus_implementation_summary.md` — итоговое описание внедрения.
- `docs/prometheus_integration_plan.md` — архитектурный план.
- `docs/info.md` — раздел «DevOps и инфраструктура → Мониторинг».

---

**Последнее обновление**: November 12, 2025.
**Ответственные**: DevOps команда (@monitoring), Backend команда (@mlops-backend).
