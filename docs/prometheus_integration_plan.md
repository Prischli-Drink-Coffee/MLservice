# Prometheus + Grafana Integration Plan

## 1. Контекст и цели

- **Зачем**: обеспечить наблюдаемость backend-сервиса, ML-пайплайна и инфраструктурных компонентов.
- **Проблема до интеграции**:
  - Нет способа оценить задержки API и объём трафика.
  - Отсутствуют метрики доменного уровня (загрузки датасетов, тренировки, TTL очистка).
  - Разработчикам и DevOps приходится логировать вручную и анализировать логи.
- **Цель**: развернуть стек Prometheus + Grafana с auto-provisioning и покрытием ключевых метрик.

### Метрики первого этапа

1. HTTP/технические: latency, размер запросов/ответов, ошибки.
2. ML-доменные: число загрузок, размер файлов, исходы и длительность тренировок.
3. Фоновые задания: циклы TTL очистки, удалённые файлы и ошибки.

## 2. Архитектура целевого решения

```text
┌──────────────┐      scrape      ┌─────────────┐     datasource     ┌───────────┐
│ FastAPI App  │ ───────────────► │ Prometheus  │ ─────────────────► │ Grafana   │
│ (backend)    │ expose /metrics  │ 9090/tcp    │  HTTP API proxy    │ 3001/tcp  │
└──────────────┘                  └─────────────┘                     └───────────┘
        ▲                                 │                                  │
        │ metrics utils                   │                                  │
        │                                stores                              │
        └─ counters/histograms ──────────┘                         prebuilt dashboard
```

- Prometheus опрашивает backend по `http://backend:8000/metrics`.
- Grafana использует встроенный datasource (provisioned) и публикует дашборд «Backend Monitoring Overview».
- Конфигурации хранятся в `infra/monitoring/` и подключаются через volume'ы.

## 3. Рабочий план

### 3.1 Подготовка

- [x] Проанализировать существующие решения (FastAPI Instrumentator, Prometheus client).
- [x] Определить список доменных метрик и их лейблы.
- [x] Согласовать формат переменных окружения (`PROMETHEUS__*`, `GRAFANA_*`).

### 3.2 Backend-интеграция

1. Добавить зависимости в `pyproject.toml` и `requirements.txt`.
2. Создать пакет `service/monitoring`:
   - `metrics.py` — counters/histograms с namespace/subsystem.
   - `setup.py` — instrumentator и экспозиция эндпоинта.
3. Обновить `service/settings.py` и DI для конфигурации `MonitoringConfig`.
4. Вызвать `setup_monitoring(app)` из `service/main.py`.
5. Инструментировать бизнес-логику (upload, training, TTL worker).

### 3.3 Инфраструктура

1. Добавить сервисы `prometheus` и `grafana` в compose-файлы (prod/dev).
2. Создать `infra/monitoring/prometheus/prometheus.yml` со scrape targets.
3. Подготовить Grafana provisioning:
   - Datasource с UID `Prometheus`.
   - Dashboard JSON (http rate, uploads, тренировки, TTL).
4. Дополнить `.env.example` новыми переменными и обновить `run.sh`.

### 3.4 Документация и обучение

- Обновить README и `docs/info.md` (раздел Monitoring & Observability).
- Подготовить:
  - `docs/prometheus_implementation_summary.md` — сводка внедрения.
  - `docs/prometheus_integration_guide.md` — практическое руководство.
- Описать smoke-тесты и команды для проверки.

### 3.5 Проверка и контроль

1. Запустить `docker compose up -d backend prometheus grafana`.
2. Проверить `http://localhost:9090/targets` (backend должен быть UP).
3. Залогиниться в Grafana (admin/admin) и убедиться, что дашборд отображает метрики.
4. Запустить `pytest backend/tests` и smoke-тест `curl http://localhost:8000/metrics`.

## 4. Риски и смягчение

| Риск | Вероятность | Влияние | Митигирующие действия |
|------|-------------|---------|------------------------|
| Падение производительности от Instrumentator | Низкая | Среднее | Возможность отключить `PROMETHEUS__ENABLED=false`, кастомные buckets |
| Утечка чувствительных данных в метрики | Низкая | Высокое | В метриках отсутствуют payload/PII, только агрегаты |
| Несоответствие портов при деплое | Средняя | Среднее | Все порты вынесены в `.env`, описано в гайде |
| Лишний доступ к Grafana | Низкая | Среднее | Требуется логин, рекомендуется сменить пароль до продакшена |

## 5. Требования к окружению

- Docker 24+, Docker Compose v2.
- Открытые порты: 8000 (backend), 9090 (Prometheus), 3001 (Grafana).
- Достаточно 512MB RAM для Prometheus + Grafana в dev-режиме.

## 6. График

| Этап | ETA | Ответственный | Статус |
|------|-----|---------------|--------|
| Аналитика и планирование | 0.5 дня | Backend | ✅ |
| Backend-инструментирование | 1 день | Backend | ✅ |
| Инфраструктура (compose + конфиги) | 0.5 дня | DevOps | ✅ |
| Документация и гайды | 0.5 дня | Tech Writer | ✅ |
| Тестирование и приёмка | 0.5 дня | QA/DevOps | ✅ |

## 7. Acceptance Criteria

- [x] `/metrics` отдаёт базовые и доменные метрики без ошибок.
- [x] Prometheus видит таргет `backend` как UP, scrape interval 15s.
- [x] Готовый Grafana dashboard доступен сразу после запуска.
- [x] Документация отражает настройку и troubleshooting.
- [x] Интеграция выключаема без редеплоя (ENV).

## 8. Дальнейшие шаги (Post-MVP)

- Добавить мониторинг очередей задач и задержек TTL-воркера.
- Настроить алерты Grafana (email/Slack) по основным метрикам.
- Интегрировать Prometheus с Alertmanager, Loki (логи) и Tempo (трейсы).
- Подготовить Terraform/Helm чарты для production окружения.

---

**Документ обновлён**: November 12, 2025
**Контакты**: DevOps (@monitoring), Backend (@mlops-backend)
