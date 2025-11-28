# TPOT Integration — Implementation Summary

**Дата**: November 27, 2025
**Статус**: 🟡 **План подготовки (0/9 задач выполнены)**
**Приоритет**: 🎯 **Перевод TrainingService на TPOT — высокий**

---

## 🎯 Цель и ожидаемый эффект

- Перенести Jobs (classification + regression) на TPOT, сохранив pipeline Jobs и metadata.
- Позволить TPOT эволюционно собирать пайплайны, комбинируя `EstimatorNode`, `ChoicePipeline`, `GraphSearchPipeline`, `FSSNode` (см. `docs/tpot.md`).
- Поддержать бюджеты времени/памяти и параллельность (`local`/`distributed`) без поломки инфраструктуры.
- Собрать leaderboard, Pareto front и метрики (`best_pipeline`, `leaderboard_top5`, `tp_generations`).

---

## 📊 Объём работ

| № | Блок | Статус | Ключевые задачи |
|---|------|--------|-----------------|
|1|**Dependency & Runtime Update**|⏳ Plan|Добавить `tpot>=0.12`, `ConfigSpace>=0.6`, `dask[distributed]`, `joblib>=1.3`, `scikit-learn>=1.5`. Пересобрать `requirements.txt`, `uv.lock` и образ Docker (graphviz, swig, build-essential).|
|2|**Search Space Layer**|⏳ Plan|Вынести TPOT search spaces в `service/services/automl/search_space.py`, поддержать `ConfigSpace` + `dict`. Документировать `GraphSearchPipeline`, `ChoicePipeline`, `FSSNode` и symbolic regression подсказки (ссылка на `docs/tpot.md`).|
|3|**TPOT Trainer**|⏳ Plan|Создать `TPOTTrainer` с `TPOTClassifier`/`TPOTRegressor`, поддержкой `generations`, `population_size`, `time_left`, `per_run_limit`, кастомных метрик и `dask_client`. Сериализовать `leaderboard`, `evaluated_individuals`, `Pareto_Front`.
|4|**TrainingService Refactor**|⏳ Plan|Интегрировать `TPOTTrainer`, сохранить fallback (`ENABLE_AUTOML_FALLBACK`), добавить метрики `best_pipeline`, `leaderboard_topk`, `tp_generations`. Обрабатывать payload (`target_column`, `metric`, `parallel_mode`).|
|5|**Parallel Execution**|⏳ Plan|Поддержать `TPOT_PARALLEL_MODE=local|distributed`, `TPOT__N_JOBS`, `TPOT__MEMORY_LIMIT_MB`, `TPOT__DASK_SCHEDULER_FILE`. Стартовать `dask-scheduler`/`dask-worker`, включая `Client`.|
|6|**Artifacts & Storage**|⏳ Plan|Сохранять `model.joblib`, `leaderboard.json`, `tp_pareto_front.json`. Поддержать MinIO/FS с JSON, содержащим `evaluated_individuals` и `Pareto_Front`.|
|7|**Monitoring & Operations**|⏳ Plan|Расширить метрики (`training_duration`, `best_score`, Pareto front size), логировать `TPOTEstimator.evaluated_individuals`. Добавить алерты на timeout, OOM, parallel fallback.|
|8|**Testing Strategy**|⏳ Plan|Unit-тесты для `TPOTTrainer`/`search_space`, integration для Jobs (mock dask), smoke с реальными dataset. Добавить `tests/test_training_service.py -k tpot`.|
|9|**Docs & Playbooks**|⏳ Plan|Обновить README, миграционный гид, интеграционные планы и добавить ссылку на `docs/tpot.md`.|

---

## 🧩 Архитектурные изменения

- `service/services/automl/`
  - `search_space.py`: строит `ConfigSpace`/`dict` search spaces (nodes + pipelines), поддерживает `GraphSearchPipeline`, `ChoicePipeline`, `FSSNode`, `EstimatorNode`.
  - `tpot_trainer.py`: инкапсулирует `TPOTClassifier`/`TPOTRegressor`, подключает `dask_client`, собирает `leaderboard`, экспортирует `model.joblib`, `leaderboard.json`, `pareto_rank`.
  - `serialization.py`: helper для сохранения `TPOT` pipeline, `evaluated_individuals`, `Pareto_Front`.
- `TrainingService`
  - В `run_for_job` определяем `task_hint` (classification/regression/auto) и вызываем `TPOTTrainer.train()`.
  - Payload включает `generations`, `parallel_mode`, `metric`, `target_column`, `time_left`, `per_run_limit`.
  - Метрики: `tp_generations`, `board_top5`, `parallel_mode`, `memory_limit_mb`.
- Инфраструктура
  - `tpot-scheduler`, `tpot-worker` (docker-compose dev) с volume `/var/run/tpot`.
  - Env vars: `TPOT__GENERATIONS`, `TPOT__POPULATION_SIZE`, `TPOT_PARALLEL_MODE`, `TPOT__CONFIG_DICT`, `TPOT__MEMORY_LIMIT_MB`, `TPOT__DASK_SCHEDULER_FILE`.

---

## 🔗 Интеграция с Jobs

- Триггер остаётся `TrainingService.run_for_job`.
- Payload:
  ```json
  {
    "dataset_id": "...",
    "target_column": "Revenue",
    "task": "auto",
    "generations": 40,
    "time_left": 600,
    "per_run_limit": 60,
    "metric": "accuracy",
    "parallel_mode": "distributed",
    "population_size": 32
  }
  ```
- `TPOTTrainer` выявляет `feat_type`, применяет `config_dict`, сохраняет `leaderboard_topk` и `Pareto_Front`.

---

## ⚙️ Параллельная работа

### Local multi-core
- `TPOT_PARALLEL_MODE=local`, `TPOT__N_JOBS=min(cpu_count-1, 8)`.
- `TPOTEstimator(n_jobs=config.n_jobs, memory_limit=config.memory_limit, generations=config.generations, population_size=config.population_size)`.
- Guard `if __name__ == "__main__"` нужен для TPOT + multiprocessing.

### Distributed (Dask)
1. Scheduler: `dask-scheduler --scheduler-file /var/run/tpot/scheduler.json --idle-timeout 300`.
2. Worker: `DASK_DISTRIBUTED__WORKER__DAEMON=False dask-worker --nthreads 1 --memory-limit 0 --scheduler-file /var/run/tpot/scheduler.json`.
3. Backend: `Client(scheduler_file=config.scheduler_file)` передаётся в `TPOTEstimator(dask_client=client, ...)`.
4. Watchdog: при недоступности `Client` — логируем `tpot_parallel_fallbacks_total` и переключаемся на `n_jobs=1`.

---

## 📈 Метрики и контроль качества

- `training_duration_seconds{mode="tpot"}`, `training_best_score{metric="accuracy"}`, `tp_generations`, `tp_population_size`.
- `TPOTEstimator.evaluated_individuals` сохраняется в `TrainingRun.details` (JSON, ≤64KB).
- Логируем `Pareto_Front`, `leaderboard_topk`, `parallel_mode`.
- QA: сравнение качества с baseline, проверка leaderboard, smoke-тесты на нескольких датасетах.

---

## ⚠️ Риски и предпосылки

- **Зависимости**: TPOT требует `graphviz`, `ConfigSpace`, `deap`, `xgboost`. CI нужен кэш колес.
- **Время & память**: `generations`/`population` растут; вводим лимиты `TPOT__TIME_LEFT`, `TPOT__MEMORY_LIMIT_MB`.
- **Dask**: scheduler/worker могут быть нестабильны; healthchecks и fallback на local.
- **Совместимость**: UI ожидает `model.joblib` и leaderboard, поддерживаем API.

---

## 🚀 Следующие шаги

1. Обновить backend dependencies и Dockerfile.
2. Реализовать `TPOTTrainer` + `search_space`.
3. Изменить `TrainingService`, логировать новые метрики, сохранить fallback.
4. Настроить `tpot-scheduler`/`tpot-worker`, обновить docs (включая `docs/tpot.md`).
5. Покрыть unit/integration тестами, провести smoke и canary rollout.

---

**Prepared by**: GitHub Copilot
**Статус**: Draft, ждёт согласования с DevOps & Data Science.
