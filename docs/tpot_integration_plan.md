```markdown
# TPOT Integration Plan — Training Jobs Upgrade

**Статус**: 🟡 План утверждается
**Приоритет**: 🎯 КРИТИЧНО ДЛЯ Q1 2026
**Дата начала**: Ноябрь 27, 2025
**ETA**: 2 спринта с буферами

---

## 📚 Содержание

1. [Обзор и цели](#обзор-и-цели)
2. [Текущее состояние](#текущее-состояние)
3. [Целевая архитектура](#целевая-архитектура)
4. [Дорожная карта внедрения](#дорожная-карта-внедрения)
5. [Параллельные режимы](#параллельные-режимы)
6. [Конфигурация и параметры](#конфигурация-и-параметры)
7. [Тестирование и QA](#тестирование-и-qa)
8. [Наблюдаемость и эксплуатация](#наблюдаемость-и-эксплуатация)
9. [Риски и зависимости](#риски-и-зависимости)
10. [План раскатки](#план-раскатки)
11. [Документация и обучение](#документация-и-обучение)

---

## 🎯 Обзор и цели

### Что меняем
- Переводим TrainingService с ручных `LinearRegression`/`LogisticRegression` на TPOT, используя эволюционный поиск pipeline-структур и кастомные `ConfigSpace`/`dict` (GraphSearchPipeline, ChoicePipeline, FSSNode, EstimatorNode).
- Добавляем богатый leaderboard, Pareto front и KPI (`best_pipeline`, `tp_generations`, `tp_population_size`).
- Поддерживаем флаги `ENABLE_AUTOML`, `TPOT_PARALLEL_MODE` с `local`/`distributed` режимами, сохраняя fallback на легковесную логику обучения.

### Ключевые результаты
- Автоматический поиск моделей заменяет ручные подборы гиперпараметров.
- Стабильный rollout с контролируемым ресурсным бюджетом.
- Производственные метрики по TPOT (Pareto front, leaderboard) доступны в UI/Swagger.

### Критерии приёмки
- TPOT запускается по умолчанию, fallback остаётся доступным.
- Payload содержит `metric`, `target_column`, `generations`, `parallel_mode`.
- Документация и интеграционные инструкции обновлены (включая `docs/tpot.md`).

---

## 🔍 Текущее состояние

| Область | Состояние | Ограничения |
|--------|-----------|-------------|
|TrainingService|Ручные baseline-модели|Нет автоML, нет leaderboard|
|Payload|Версия только `target_column`, `task`|Нельзя настраивать бюджеты/метрики|
|Инфраструктура|Backend работает однопроцессно|Нет Dask scheduler/workers процессов|
|Документация|Есть auto-sklearn guide|Нужно переориентироваться на TPOT|

---

## 🏗️ Целевая архитектура

```
┌──────────────────────────────────────────────────────────────┐
│ FastAPI Backend                                            │
│  ├─ TrainingService                                        │
│  │   ├─ TPOTTrainer (TPOTClassifier/TPOTRegressor)          │
│  │   │     ├─ SearchSpace (ConfigSpace/GraphSearchPipeline)│
│  │   │     ├─ Dask Client -> TPOTEstimator                 │
│  │   │     ├─ Serialization (leaderboard, pipeline, metrics)│
│  │   └─ Fallback Trainer (legacy pipeline)                 │
│  └─ Monitoring & Logging                                   │
└────────────┬────────────────────┬──────────────┬──────────┘
             │                    │              │
┌────────────▼────────┐ ┌─────────▼──────────┐ ┌─────────▼────────┐
│Local n_jobs         │ │Dask Scheduler/     │ │MinIO / FS Storage│
│(TPOT_PARALLEL_MODE=local)││Workers (--scheduler-file)││model.joblib + leaderboard│
└─────────────────────┘ └────────────────────┘ └──────────────────┘
```

- `TPOTTrainer` строит `ConfigSpace`-базовые search spaces, можно переопределить `TPOT__CONFIG_DICT` или передать узлы (EstimatorNode, ChoicePipeline, GraphSearchPipeline).
- Сохраняем `model.joblib`, `leaderboard.json`, `tp_pareto_front.json`, `evaluation_summary`.
- Backend подключается к Dask client и передаёт его в `TPOTEstimator`, либо использует `n_jobs` для локального режима.

---

## 🛣️ Дорожная карта внедрения

### Phase 0 — Подготовка окружения (3-4 дня)
1. Dockerfile: `build-essential`, `graphviz`, `swig`, `cmake`, `libopenblas-dev`, `libomp-dev`.
2. Python deps:
   - `tpot>=0.12`, `ConfigSpace>=0.6`, `dask[distributed]`, `joblib>=1.3`, `scikit-learn>=1.5`, `numpy`, `pandas`.
   - `uv pip compile`, обновить `requirements.txt`, `uv.lock`.
3. CI: кеш колес, увеличенные таймауты.
4. Feature flags: `ENABLE_AUTOML`, `ENABLE_AUTOML_FALLBACK`, `TPOT_PARALLEL_MODE`, `TPOT__CONFIG_DICT`.

### Phase 1 — Бизнес-логика (1 неделя)
1. Создать `service/services/automl/` с `search_space`, `tpot_trainer`, `serialization`.
2. `TPOTTrainer.train()`:
   - Поддержка `target_column`, `feat_type`, `CustomConfigSpace`.
   - `generations`, `population_size`, `time_left`, `per_run_limit`, `dask_client`.
   - Сохранение `leaderboard_topk`, `evaluated_individuals`, `Pareto_Front`.
3. `TrainingService`: интеграция `TPOTTrainer`, fallback, метрики `tp_generations`, `leaderboard_topk`, `parallel_mode`.
4. `settings.py`, `container.py`: подключение env vars, `TPOT__CONFIG_DICT` (по умолчанию `"linear"` или при необходимости используйте TPOT API — `tpot.config.get_search_space('regressors')`).

### Phase 2 — Параллельность и инфраструктура (4-5 дней)
1. `docker-compose`: `tpot-scheduler`, `tpot-worker` (volume с `/var/run/tpot`).
2. CLI-скрипты для запусков `scheduler` и `worker`.
3. Backend ожидает `scheduler.json`, создает `Client` и передает `dask_client` в `TPOTEstimator`.
4. Healthchecks и auto-restart workers.

### Phase 3 — Тесты и rollout (1 неделя)
1. Unit: тесты для search spaces, trainer, serialization.
2. Integration: `pytest` с `time_left=30`, `parallel_mode=local`.
3. Smoke: Jobs с разными dataset, проверка `leaderboard`.
4. Performance: 3 dataset (малый/средний/шумный).
5. Canary: включение для 10% пользователей, мониторинг `tpot_parallel_fallbacks_total`.

---

## ⚙️ Параллельные режимы

### Local multi-core
- `TPOT_PARALLEL_MODE=local`, `TPOT__N_JOBS=min(cpu_count-1, 8)`.
- `TPOTEstimator(n_jobs=config.n_jobs, memory_limit=config.memory_limit, generations=config.generations, population_size=config.population_size)`.
- `if __name__ == "__main__"` guard обязателен.

### Distributed (Dask)
1. Scheduler:
   ```bash
   dask-scheduler --scheduler-file /var/run/tpot/scheduler.json --idle-timeout 300
   ```
2. Worker:
   ```bash
   DASK_DISTRIBUTED__WORKER__DAEMON=False \
   dask-worker --nthreads 1 --memory-limit 0 --scheduler-file /var/run/tpot/scheduler.json
   ```
3. Backend:
   ```python
   client = Client(scheduler_file=config.scheduler_file)
   tpot = TPOTEstimator(dask_client=client)
   ```
4. Watchdog: если `Client` недоступен, логируем `tpot_parallel_fallbacks_total` и переключаемся на `n_jobs=1`.

---

## 🧮 Конфигурация и параметры

| Параметр | Источник | Назначение | По умолчанию |
|----------|----------|------------|--------------|
|`TPOT__GENERATIONS`|env/payload|Количество поколений|40|
|`TPOT__POPULATION_SIZE`|env/payload|Размер популяции|64|
|`TPOT__TIME_LEFT`|env/payload|Бюджет поиска (сек)|600|
|`TPOT__PER_RUN_LIMIT`|env/payload|Время на модель|60|
|`TPOT__METRIC`|payload|Метрика оптимизации|`accuracy`/`r2`|
|`TPOT__CV_FOLDS`|env|CV folds|5|
|`TPOT__CONFIG_DICT`|env|Search space dict/ConfigSpace|
|`TPOT_PARALLEL_MODE`|env|`local` / `distributed` / `off`|local|
|`TPOT__N_JOBS`|env|Число локальных воркеров|`cpu_count-1`|
|`TPOT__MEMORY_LIMIT_MB`|env|Лимит памяти на worker|3072|
|`TPOT__DASK_SCHEDULER_FILE`|env|Путь к scheduler.json|/var/run/tpot/scheduler.json|
|`ENABLE_AUTOML_FALLBACK`|env|Разрешить fallback|true|

Payload:
```json
{
  "dataset_id": "...",
  "target_column": "Revenue",
  "task": "auto",
  "time_left": 900,
  "per_run_limit": 60,
  "metric": "f1",
  "parallel_mode": "distributed",
  "generations": 20,
  "population_size": 32
}
```

---

## ✅ Тестирование и QA

1. **Unit**: мок TPOT (`fit`, `predict`, `export_pipeline`), проверка `search_space`.
2. **Integration**: `pytest tests/test_training_service.py -k tpot`, Jobs с `time_left=30`, check `leaderboard` + `model.joblib`.
3. **Regression**: `ENABLE_AUTOML=false` → fallback path.
4. **Performance**: 3 датасета (малый/средний/шумный), измерить `training_duration_seconds`, `tp_population_size`.
5. **Canary**: включение TPOT для 10% пользователей, мониторинг `tpot_parallel_fallbacks_total`.

---

## 📈 Наблюдаемость и эксплуатация

- Prometheus: `training_duration_seconds{mode="tpot"}`, `training_best_score{metric="accuracy"}`, `tpot_parallel_fallbacks_total`, `tp_generation`, `tp_population_size`.
- Логирование: `TPOTEstimator.evaluated_individuals` (JSON snippet), `leaderboard_topk`, `Pareto_Front`.
- Alerting: >3 ошибок TPOT подряд, `training_duration_seconds > TPOT__TIME_LEFT`, `parallel fallback`.

---

## ⚠️ Риски и зависимости

| Риск | Вероятность | Влияние | Митигирующие меры |
|------|------------|---------|------------------|
|Сложные зависимости TPOT|Средняя|Высокое|CI кеширует wheels, отдельный layer с build deps|
|OOM при больших search spaces|Средняя|Среднее|Лимиты `TPOT__MEMORY_LIMIT_MB`, мониторинг Dask|
|Неустоявшийся Dask|Средняя|Среднее|Healthchecks, auto-restart, fallback на local|
|Долгое время отклика Jobs|Средняя|Среднее|`per_run_limit`, `time_left`, `parallel_mode` guard|
|Новые метрики без отображения|Низкая|Низкое|UI пока скрывает поля, API совместим|

---

## 🚀 План раскатки

1. **Week 1 (Dev)**: включить TPOT в dev, локальный `n_jobs`.
2. **Week 2 (Staging)**: поднять scheduler/workers, прогнать тесты, smoke на 3 датасетах.
3. **Week 3 (Prod Canary)**: 10% пользователей, параллельный режим `distributed`.
4. **Week 4 (Prod GA)**: включить для всех, метрики в UI.
5. **Post-GA**: performance tuning, дополнительные search spaces, документация.

---

## 📝 Документация и обучение

- Обновить README (раздел Training) с описанием TPOT режимов.
- Добавить playbook для DevOps по запуску scheduler/worker и мониторингу `TPOT_PARALLEL_MODE`.
- Ссылать Data Science на `docs/tpot.md` для создания новых search spaces / symbolic regression экспериментов.
- Провести воркшоп (AutoML overview, `leaderboard`, `TPOTEstimator.evaluated_individuals`).
- Подготовить FAQ по сборке образа, cборке колёс, лимитам времени.

---

**Ответственный**: ML Platform Team
**Документ подготовлен**: GitHub Copilot (Draft)
**Следующий пересмотр**: после согласования с DevOps и Data Science
