# TPOT Migration Guide — From Baseline Models to TPOT AutoML

**Версия документа**: 1.0 (Draft)
**Целевая аудитория**: Backend инженеры, DevOps, QA
**Контакты**: @ML-Platform-Team

---

## 🧭 Обзор

Проект переводит `TrainingService` с ручных baseline-моделей на TPOT — библиотеку, которая эволюционно собирает лучшие sklearn-пайплайны и графы. Гид описывает шаги подготовки окружения, конфигурации и rollout, чтобы внедрить `TPOTClassifier`/`TPOTRegressor` без потери стабильности текущих Jobs. Более детально о поиске и пространствах смотрите в `docs/tpot.md`.

---

## ✅ Предварительные требования

1. **Инфраструктура**
   - Docker-образ backend содержит build deps (`build-essential`, `cmake`, `libopenblas-dev`, `libomp-dev`, `graphviz`, `swig`).
   - MinIO/FS готов принимать `model.joblib` + `leaderboard.json` c Pareto-матрицей.
   - `uvicorn`/`gunicorn` запускаются через `if __name__ == "__main__"` (TPOT + Dask не любят spawn-mode без guard).

2. **Команда**
   - К<|vq_lbr_audio_91644|><|vq_lbr_audio_117764|><|vq_lbr_audio_76978|><|vq_lbr_audio_13059|><|vq_lbr_audio_25258|><|vq_lbr_audio_90217|><|vq_lbr_audio_14640|><|vq_lbr_audio_24383|><|vq_lbr_audio_73152|><|vq_lbr_audio_86150|><|vq_lbr_audio_15052|><|vq_lbr_audio_80976|><|vq_lbr_audio_127303|><|vq_lbr_audio_92356|><|vq_lbr_audio_99334|><|vq_lbr_audio_45102|><|vq_lbr_audio_119461|><|vq_lbr_audio_7573|><|vq_lbr_audio_21910|><|vq_lbr_audio_11160|><|vq_lbr_audio_105621|><|vq_lbr_audio_35778|><|vq_lbr_audio_23962|><|vq_lbr_audio_15192|><|vq_lbr_audio_10096|><|vq_lbr_audio_60989|><|vq_lbr_audio_45241|><|vq_lbr_audio_59657|><|vq_lbr_audio_96125|><|vq_lbr_audio_5354|><|vq_lbr_audio_11392|><|vq_lbr_audio_40948|><|vq_lbr_audio_5562|><|vq_lbr_audio_93961|><|vq_lbr_audio_55993|><|vq_lbr_audio_32334|><|vq_lbr_audio_110274|><|vq_lbr_audio_31928|><|vq_lbr_audio_54837|><|vq_lbr_audio_83661|><|vq_lbr_audio_123585|><|vq_lbr_audio_124850|><|vq_lbr_audio_45384|><|vq_lbr_audio_62626|><|vq_lbr_audio_55226|><|vq_lbr_audio_68922|><|vq_lbr_audio_119659|><|vq_lbr_audio_64492|><|vq_lbr_audio_111644|><|vq_lbr_audio_10064|><|vq_lbr_audio_57208|><|vq_lbr_audio_118089|><|vq_lbr_audio_74521|><|vq_lbr_audio_73470|><|vq_lbr_audio_100439|><|vq_lbr_audio_60688|><|vq_lbr_audio_49659|><|vq_lbr_audio_30046|><|vq_lbr_audio_2716|><|vq_lbr_audio_125282|><|vq_lbr_audio_75345|><|vq_lbr_audio_96965|><|vq_lbr_audio_67804|><|vq_lbr_audio_105251|><|vq_lbr_audio_127512|><|vq_lbr_audio_62975|><|vq_lbr_audio_9708|><|vq_lbr_audio_21755|><|vq_lbr_audio_98840|><|vq_lbr_audio_49659|><|vq_lbr_audio_42593|><|vq_lbr_audio_32674|><|vq_lbr_audio_41821|><|vq_lbr_audio_119715|><|vq_lbr_audio_6482|><|vq_lbr_audio_115762|><|vq_lbr_audio_60064|><|vq_lbr_audio_41414|><|vq_lbr_audio_95714|><|vq_lbr_audio_3583|><|vq_lbr_audio_18871|><|vq_lbr_audio_60971|><|vq_lbr_audio_39415|><|vq_lbr_audio_32273|><|vq_lbr_audio_21303|><|vq_lbr_audio_35940|><|vq_lbr_audio_43682|><|vq_lbr_audio_116296|><|vq_lbr_audio_121577|><|vq_lbr_audio_16321|><|vq_lbr_audio_25683|><|vq_lbr_audio_26052|><|vq_lbr_audio_59732|><|vq_lbr_audio_124207|><|vq_lbr_audio_36397|><|vq_lbr_audio_81651|><|vq_lbr_audio_18686|><|vq_lbr_audio_59652|><|vq_lbr_audio_39590|><|vq_lbr_audio_121238|><|vq_lbr_audio_18638|><|vq_lbr_audio_31577|><|vq_lbr_audio_236|><|vq_lbr_audio_50616|><|vq_lbr_audio_42286|> parameter search space.
3. **Данные**
   - Тестовые CSV для классификации и регрессии.
   - Минимум 2 Jobs для smoke-тестов (один classification, один regression).

---

## 🔧 Этапы миграции

### Этап 0 — Подготовка окружения

1. Обновить зависимости:
   ```bash
   cd backend
   uv pip install "tpot>=0.12" "ConfigSpace>=0.6" "dask[distributed]" "joblib>=1.3" "scikit-learn>=1.5" --session backend
   uv pip compile pyproject.toml -o requirements.txt
   uv pip compile --generate-hashes pyproject.toml -o uv.lock
   ```
   TPOT использует `ConfigSpace`, `deap`, `numpy`, `pandas` и может запускать `TPOTClassifier`/`TPOTRegressor` с `GraphSearchPipeline` или `TreePipeline` (см. `docs/tpot.md`).

2. Обновить Dockerfile:
   - Добавить `build-essential`, `cmake`, `libopenblas-dev`, `libomp-dev`, `graphviz`, `swig`.
   - Собрать образ: `docker compose build backend`.

3. Добавить конфигурацию (пример `.env.example`):
   ```ini
   TPOT__GENERATIONS=40
   TPOT__POPULATION_SIZE=64
   TPOT__TIME_LEFT=600
   TPOT__PER_RUN_LIMIT=60
   TPOT__METRIC=accuracy
   TPOT__CV_FOLDS=5
   TPOT__CONFIG_DICT='linear'  # Рекомендуется: строковое имя пространства поиска (например 'linear' или 'graph')
   # Альтернатива: ссылка на TPOT API — `tpot.config.get_search_space('regressors')` или модуль.атрибут для старых версий.
   TPOT__N_JOBS=8
   TPOT__MEMORY_LIMIT_MB=3072
   TPOT_PARALLEL_MODE=local
   TPOT__TMP_DIR=/tmp/tpot
   TPOT__DASK_SCHEDULER_FILE=/var/run/tpot/scheduler.json
   ENABLE_AUTOML=true
   ENABLE_AUTOML_FALLBACK=true
   ```
   `TPOT__CONFIG_DICT` можно переопределить кастомным `ConfigSpace`/`dict` для `TpotNode` или `GraphSearchPipeline`, как описано в `docs/tpot.md`.

4. Обновить `settings.py`/`container.py`: добавить env vars, спрячьте `TPOT`-конфиг в `service/services/automl/tpot_trainer.py`.

---

### Этап 1 — Локальные проверки (Dev)

1. Запустить backend:
   ```bash
   TPOT_PARALLEL_MODE=local ENABLE_AUTOML=true uvicorn service.main:app --reload
   ```
2. Прогнать тесты:
   ```bash
   pytest tests/test_training_service.py -k tpot --maxfail=1
   pytest tests/test_jobs_integration.py -k tpot --maxfail=1
   ```
3. Запустить Job → убедиться, что `TrainingRun.metrics` теперь содержит `best_pipeline`, `leaderboard_topk`, `evaluated_individuals`, `tp_rank`, `parallel_mode`.
4. Проверить артефакты `model.joblib`, `leaderboard.json` (TPOT экспортирует pipeline и рейтинг найденных `individuals`).

---

### Этап 2 — Распределённый режим

1. Добавить сервисы в `docker-compose.dev.yaml`:
   ```yaml
   tpot-scheduler:
     image: daskdev/dask:latest
     command: dask-scheduler --scheduler-file /var/run/tpot/scheduler.json --idle-timeout 600
     volumes:
       - ./infra/monitoring:/var/run/tpot

   tpot-worker:
     image: daskdev/dask:latest
     command: >
       /bin/bash -lc 'DASK_DISTRIBUTED__WORKER__DAEMON=False \
         dask-worker --nthreads 1 --memory-limit 0 \
         --scheduler-file /var/run/tpot/scheduler.json'
     deploy:
       replicas: 2
     volumes:
       - ./infra/monitoring:/var/run/tpot
   ```
2. Backend должен ждать `scheduler.json` перед стартом (entrypoint).
3. При `TPOT_PARALLEL_MODE=distributed` создать `dask.distributed.Client` и передать его в `TPOTEstimator(dask_client=client ...)`.
4. Убедиться, что `TPOTEstimator.evaluated_individuals` записывает `Pareto_Front`, `number_of_nodes_objective` (см. `docs/tpot.md`).

---

### Этап 3 — Staging

1. Включить `ENABLE_AUTOML=true`, `TPOT_PARALLEL_MODE=local`.
2. `docker compose -f docker-compose.dev.yaml up -d backend tpot-scheduler tpot-worker`.
3. Прогнать `pytest tests/ -k "tpot or training"`.
4. Запустить 3 Jobs, собрать метрики: `training_duration_seconds`, `training_best_score`, `tp_population_size`.
5. Проверить `leaderboard.json`, `tp_pareto_front` и ensure `job.payload.metric` совпадает с `TPOT__METRIC`.

---

### Этап 4 — Production rollout

1. Включить AutoML для 10% пользователей (`hash(user_id) % 10 == 0`).
2. Мониторить 48 часов: `training_success_total{mode="tpot"}`, `tpot_parallel_fallbacks_total`, `dask_worker_ready`.
3. Когда всё стабильно, переключить `TPOT_PARALLEL_MODE=distributed` и задеплоить `tpot-scheduler`/`tpot-worker` в prod.
4. GA: ключевые метрики (accuracy / $R^2$) сопоставимы с baseline, fallback остаётся включённым.

---

## 🧪 Проверки после миграции

| Проверка | Где | Ожидаемый результат |
|----------|-----|---------------------|
|`TrainingRun.metrics`|DB/Swagger|`best_pipeline`, `leaderboard_topk`, `pareto_front`, `tp_generations` отображаются|
|Артефакт модели|MinIO/FS|`model.joblib` (TPOT pipeline) и `leaderboard.json` с `evaluated_individuals`|
|Логи backend|`backend/logs`|TPOT завершился без `TimeoutError`, метрика `tpot_population_size` логируется|
|Prometheus|Grafana|`training_duration_seconds{mode="tpot"}` растёт, `tpot_parallel_fallbacks_total` либо 0, либо записан|
|UI профиль|Frontend|Новые поля `best_pipeline`, `leaderboard_topk` отображены|

---

## 🔁 Rollback план

1. `ENABLE_AUTOML=false` и redeploy backend.
2. Остановить `tpot-scheduler`/`tpot-worker`.
3. Удалить временные директории `/tmp/tpot*`.
4. Проверить, что Jobs используют lightweight путь (старые модели).

---

## 🆘 Troubleshooting

| Симптом | Причина | Как лечим |
|---------|---------|---------|
|`TPOTError: No valid pipeline found`|Конфиг search space слишком строгий или `TPOT__TIME_LEFT` мал|Увеличить `TPOT__TIME_LEFT`, добавить больше node/pipeline search spaces (`docs/tpot.md`), временно снизить `population_size`|
|`TimeoutError`|`generations`/`per_run_limit` слишком большие|Понизить `TPOT__GENERATIONS`, `TPOT__PER_RUN_LIMIT`, включить checkpointing|
|`Worker process died`|OOM dask worker|Увеличить `TPOT__MEMORY_LIMIT_MB`, сократить `n_jobs`, monitor dask prometheus|
|`Can't connect to scheduler`|`scheduler.json` ещё не создан|Добавить wait-loop в entrypoint, проверять volume/permits|
|`Pareto_Front` пустой|Все модели получают одинаковые метрики|Добавить больше разнообразных search spaces (`GraphSearchPipeline`, `FSSNode`), посмотреть `tpot.md` примеры|

---

## ✅ Checklist перед GA

- [ ] CI зелёный, все `tpot`-тесты проходят.
- [ ] Документация обновлена (`docs/tpot.md`, этот гид, README).
- [ ] DevOps настроили `tpot-scheduler` и `tpot-worker`.
- [ ] QA подтвердили качество моделей на тестовых датасетах.
- [ ] Rollback план проверен (feature flag, repo).

---

## 📚 См. также

- `docs/tpot.md` — примеры symbolic search space, custom config, графов и визуализации Pareto front.
- TPOT config dict позволяет собрать специфический pipeline (`EstimatorNode`, `ChoicePipeline`, `GraphSearchPipeline`).
