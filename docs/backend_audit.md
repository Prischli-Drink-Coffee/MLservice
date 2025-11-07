# Backend: аудит несоответствий, ошибок и незавершённых частей

Ниже перечислены выявленные проблемы в бэкенд-части проекта: несоответствия концепции, отсутствующие или незавершённые реализации, ошибки в логике, несовместимые интерфейсы, баги и опечатки. Каждая проблема содержит ссылку на файл(ы) и краткое описание сути.

---

## 1) Концептуальные несоответствия с ТЗ

- Концепция проекта: загрузка пользовательских обучающих данных и запуск ML jobs на обучение классических моделей (scikit-learn). В коде присутствуют и доминируют следующие несоответствующие домены:
  - Графовый конструктор/оркестратор, ноды/эджи, «Graph/Telegram» API: `service/presentation/routers/ml_api/*`, `service/scripts/core/*`, ссылки на `GraphCompiler`, `NodeRegistry` и т.п.
  - Telegram-боты/вебхуки/очереди, Kafka-интеграция — отсутствует в ТЗ.
  - Множество схем/репозиториев/моделей для графов и Telegram, которых нет в БД и миграциях.
- Отсутствует реализация классических ML-пайплайнов (sklearn), нет загрузки датасетов/валидации/обучения/метрик. В `requirements.txt` нет зависимостей `scikit-learn`, `pandas`, `numpy`.

Последствие: текущая кодовая база не соответствует продуктовой цели и не может реализовать заявленный сценарий обучения ML-моделей пользователем.

---

## 2) Критические ошибки контейнера зависимостей и жизненного цикла

- `service/container.py`:
  - Используются неизвестные имена и зависимости: `GraphCompilerName`, `GraphJobStateStoreName`. Они не объявлены в контейнере и/или не импортированы.
  - Создаётся `PostgresJobStateStore` с зависимостью на несуществующий в контейнере компилятор графов.
  - Регистрируются `MLRepositoryName = "MLRepository"`, но в файле `service/repositories/ml_repository.py` класс называется `GraphRepository`. Несоответствие имени провайдера/класса.
  - В контейнер не добавлены и не инициализируются компоненты, от которых зависят роутеры: `GraphService`, `TelegramService`, `FileSaverService`, `FileRepository`, абстрактное файловое хранилище и т.д.
- `service/utils/app_lifespan.py`:
  - Импортирует несуществующий модуль: `service.infrastructure.kafka.kafka_service` (`KafkaConfig`, `init_kafka`, `shutdown_kafka`).
  - В `health_check()` вызывается `ml_service.get_status()`, но у `MLService` нет метода `get_status`.
  - Нет запуска фонового процессора задач (`NewJobProcessor`) через `BackgroundTaskManager` — задачи не стартуют.
- `service/main.py` подключает маршруты (`ml_router`), которые зависят от недостающих сервисов/репозиториев и нерабочих моделей.

Последствие: приложение не стартует либо падает на этапе сборки контейнера или инициализации.

---

## 3) Файловое хранилище: противоречивые и незавершённые реализации

- В коде присутствуют две разные концепции хранилища:
  1) Простое локальное хранилище вложений-конвертов: `service/infrastructure/storage/file_storage.py` (использует `DataEnvelope`, `MediaAsset`, `StoragePointer`).
  2) S3-подобное хранилище для пользовательских файлов через абстракцию: `service/services/file_saver_service.py` ожидает `service.infrastructure.file_storage.abstract_storage.FileStorage` (такого модуля нет в репозитории) и работает с сущностью `UserImage` (отсутствует в моделях/миграциях).
- `FileSaverService` зависит от `FileRepository`, но:
  - Контейнер не регистрирует ни `FileSaverService`, ни `FileRepository`.
  - Роутер `files_api` не подключён в `main.py`.
- Переменные окружения в `FileStorageConfig` используют префикс `TELERAG_*` (наследие другого проекта), не согласованы с остальной конфигурацией.

Последствие: API загрузки/чтения файлов неработоспособно; реализация распадается на два несовместимых подхода.

---

## 4) Модели БД и миграции: рассинхрон и ошибки

- Alembic-макет (`backend/alembic/versions/001_initial_migration.py`) создаёт только схемы/таблицы:
  - `profile.user`, `profile.user_launch`, `session.user_session`.
- В `service/models/db/db_models.py` определены множество сущностей, отсутствующих в миграциях:
  - `MLModel`, `MLExecution`, `UserFile` (раньше подразумевалось `UserImage`), `MLJobState` и др. — нет соответствующих миграций.
  - Отсутствуют модели `Graph`, `GraphExecution`, `TelegramBot`, используемые в репозиториях (`stats_repository`, `ml_repository`).
- Явные ошибки в моделях:
  - Дублирующий импорт `BigInteger` и конфликт с типом (`from sqlalchemy import BigInteger` и `from sqlalchemy.types import BigInteger`).
  - Несовпадение `relationship`:
    - В `User` задано `ml: Mapped[list["MLModel"]] = relationship(back_populates="user")`, но в `MLModel` обратная сторона называется `user = relationship(back_populates="ml_models")`. Нет атрибута `ml_models` в `User`.
    - `UserFile` ссылается `back_populates="user_files"`, но у `User` нет `user_files`.
  - Неверные/неполные `ForeignKey` со схемами. Пример: в `MLExecution` `ForeignKey("ml_model.id")` при `__table_args__ = {"schema": "ml_execution"}` и разных схемах таблиц — должен быть явный путь (`"ml_model.ml_model.id"`), либо одинаковая схема.
  - Несогласованность имён: в коде сервисов/репозиториев используется `UserImage`, а в моделях определён `UserFile`.
- Логики графов (`Graph*`) и Telegram отсутствуют в моделях, но используются повсеместно.

Последствие: ORM-код массово ломается при импорте/запросах; база данных не соответствует модели.

---

## 5) Репозитории: несоответствия моделям и API

- `service/repositories/ml_repository.py`:
  - Класс называется `GraphRepository`, но контейнер ожидает `MLRepository`.
  - Импортирует отсутствующие модели `Graph`, `GraphExecution`.
  - Оперирует полями/таблицами, которых нет в миграциях.
- `service/repositories/job_repository.py`:
  - Использует поля, которых нет в `profile.user_launch`: `source_image_ids`, `result_image`.
  - Возвращает/принимает `JobLogic` с несовместимой схемой относительно БД.
- `service/repositories/file_repository.py`:
  - Импортирует несуществующую модель `UserImage`.
  - Базовый класс — опечатка `BseRepository` вместо `BaseRepository` (введён алиас, но это маскирует проблему нейминга).
- `service/repositories/stats_repository.py`:
  - Используются отсутствующие модели `Graph`, `GraphExecution`, `TelegramBot`.
- Общие замечания:
  - Методы и селекты предполагают структуры данных и индексы, которых нет.
  - Несоответствие типов/имён приводит к ошибкам времени выполнения и при компиляции запросов.

Последствие: репозитории неработоспособны, запросы к БД не выполняются.

---

## 6) Сервисы: незавершённость и расхождения

- `service/services/ml_service.py`:
  - Львиная доля кода закомментирована; фактическая логика создания/запуска ML отсутствует.
  - `create_ml_run()` не возвращает результат и не завершена.
  - Ориентация на граф-орктестрацию/реестр нод vs требуемые sklearn-пайплайны.
- `service/services/job_processor.py`:
  - Имитирует обработку (sleep), заполняет `result_image` — поля нет в БД.
  - Не интегрирован в жизненный цикл приложения (не стартует автоматически).
- `service/services/file_saver_service.py`:
  - Зависит от отсутствующих абстракций и моделей (`FileStorage`, `UserImage`).
- `service/services/stats_service.py`:
  - Обёртка над неработоспособным `StatsRepository`.
- `service/services/profile_service.py`/`auth_service.py`:
  - В целом ближе к рабочему состоянию, но зависят от целостности БД и другой экосистемы.

Последствие: бизнес-функции ML/Jobs/Files не выполняются, сервисы не могут отработать end-to-end.

---

## 7) Презентационный слой (роутеры/схемы): ошибки и лишние домены

- `service/presentation/routers/ml_api/ml_api.py`:
  - Роутер фактически про графы и Telegram, а не про ML-обучение.
  - Дублирование эндпоинта `update_graph` (объявлён дважды по одному пути).
  - Зависимости на `GraphServiceDep`, `TelegramServiceDep` — таких сервисов нет в контейнере.
- `service/presentation/routers/files_api/files_api.py`:
  - Использует `config.allowed_extensions` и `config.max_file_size_byte`, которых нет в `service.settings.Config`.
  - Зависит от `FileSaverService` (не зарегистрирован) и модели `UserImage` (не существует).
  - Роутер не подключён в `main.py`.
- `service/presentation/routers/stats_api/*` и часть схем завязаны на отсутствующие модели (`Graph`, `TelegramBot`).
- `service/presentation/dependencies/auth_checker.py`:
  - Жёстко привязан к cookie с названием `beautiful_cookie` и хранит JWT в cookie без `secure`/`samesite=strict` (см. ниже безопасность).

Последствие: API-интерфейс неполный/несогласованный, множество эндпоинтов не будут инициализированы или упадут при первом запросе.

---

## 8) Инфраструктурные несоответствия/опечатки

- Следы другого проекта:
  - Переменные окружения `TELERAG_*`, логи «Shutting down TeleRAG application…» и т.п.
  - Отсылки к Kafka, Telegram, граф-оркестратору, которых нет в ТЗ.
- Нейминг и опечатки:
  - `BseRepository` (алиас), `GraphJobState`/`MLJobState` путаница.
  - Импорты одновременно через `service.*` и `backend.service.*`.
  - Двойной импорт `HTTPException` (`fastapi` и `starlette`) в `exceptions_handlers.py` — затенение имён.
- Контейнер/DI:
  - Отсутствие регистраций для критических зависимостей (`FileSaverService`, `FileRepository`, граф/telegram сервисов), при этом роутеры на них зависят.

Последствие: повышенная хрупкость и невозможность собрать согласованную систему.

---

## 9) Jobs: неполная логика работы с ML-сервисами

- Нет конвейера: загрузка пользовательского датасета → валидация → обучение (sklearn) → сохранение артефактов/метрик → выдача статуса/результатов.
- Текущие `JobService`/`JobRepository` работают с полями, которых нет в БД; фоновые задачи не стартуют.
- Нет единообразных статусов и жизненного цикла для ML-задачи обучения.

Последствие: невозможно создать и довести до конца ML job на обучение модели.

---

## 10) Безопасность и настройки

- JWT кладётся в cookie `beautiful_cookie` с `secure=False`, `samesite="lax"` (в `auth_api.py`) — небезопасно для продакшена.
- Глобальный логгер в режиме DEBUG по умолчанию (`settings.LOGGING_LEVEL`), `disable_existing_loggers=True` — может ломать логи сторонних библиотек.
- CORS-конфиг минимальный; отсутствие белых списков по умолчанию может приводить к неожиданным блокировкам/доступу.

---

## 11) Зависимости и окружение

- Для заявленной ML-функциональности отсутствуют базовые пакеты: `scikit-learn`, `pandas`, `numpy`, `joblib` и т.п.
- Присутствуют тяжёлые и неиспользуемые зависимые стеки (LangChain, Kafka, Qdrant, LangGraph и др.) — шум и риск конфликтов.

Последствие: невозможно реализовать ML-пайплайны без доустановки зависимостей; текущие зависимости раздувают окружение без пользы.

---

## 12) Перечень отсутствующих/мертвых модулей/символов (референсы без реализаций)

- Модули/символы, упомянутые в коде, но отсутствующие в репозитории:
  - `service.infrastructure.kafka.kafka_service` (`KafkaConfig`, `init_kafka`, `shutdown_kafka`).
  - `service.infrastructure.kafka.messages.EnvelopeMessage`.
  - `service.services.graph_orchestrator` (`GraphJobState`, `GraphJobStateStore`, `NodeInputState`).
  - `service.scripts.nodes.*` (langchain, ai, control_flow, system, telegram).
  - `service.infrastructure.file_storage.abstract_storage.FileStorage`.
  - ORM-модели: `Graph`, `GraphExecution`, `TelegramBot`, `UserImage`, `GraphJobState`.
  - DI-именованные провайдеры: `GraphCompilerName`, `GraphJobStateStoreName`, сервисы `GraphService`, `TelegramService`.

---

## 13) Примеры точечных ошибок по файлам

- `service/container.py` — неизвестные имена (`GraphCompilerName`, `GraphJobStateStoreName`), рассинхрон имён `MLRepository` ↔ `GraphRepository`.
- `service/utils/app_lifespan.py` — импорт несуществующих Kafka-компонентов; вызов несуществующего `MLService.get_status()`; отсутствие регистрации фоновых задач (JobProcessor).
- `service/infrastructure/job_state/postgres_store.py` — импорты несуществующих модулей/классов; обращение к `GraphJobStateModel`, отсутствующему в `db_models.py`.
- `service/presentation/routers/ml_api/ml_api.py` — дублируется `update_graph`, несуществующие сервисы в DI, домен Telegram/Graph.
- `service/presentation/routers/files_api/files_api.py` — обращение к `config.allowed_extensions`/`config.max_file_size_byte` (в `settings.Config` их нет); несуществующие зависимости.
- `service/repositories/job_repository.py` — поля `source_image_ids`/`result_image` в `UserLaunch` отсутствуют.
- `service/repositories/file_repository.py` — `UserImage` отсутствует, несогласованный базовый класс.
- `service/repositories/stats_repository.py` — отсутствующие модели `Graph`, `GraphExecution`, `TelegramBot`.
- `service/models/db/db_models.py` — несогласованные relationships, ForeignKey со схемами, опечатки и дубли импортов, рассинхрон с миграциями.
- `service/services/ml_service.py` — незавершённые методы, закомментированный основной функционал.
- `service/infrastructure/storage/file_storage.py` — связка с `DataEnvelope` из другого контура, переменные окружения с префиксом `TELERAG_*`.
- `service/presentation/handlers/exceptions_handlers.py` — затенение `HTTPException` (импорт из `starlette` и `fastapi`).

---

## 14) Итоговые выводы

- Бэкенд содержит существенные следы другого продукта (графы/Telegram/Kafka) и не реализует заявленную функциональность ML-обучения.
- Массовые рассинхроны между слоями (API ↔ сервисы ↔ репозитории ↔ модели ↔ миграции) делают код неисполняемым.
- До устранения указанных проблем сервис нельзя запустить и использовать по назначению (загрузка данных → обучение моделей → управление job'ами и результатами).

---

## 15) Прогресс рефакторинга и внедрение ML pipeline v1 (обновление)

Статус изменений после этапа «Зачистка» и первичной реализации ML-пайплайна:

### Выполнено

- Удалён/застаблен легаси граф/telegram/kafka функционал:
  - `postgres_store.py` заменён stub-константой.
  - `ml_api.py` очищен от Telegram/Graph эндпоинтов; добавлены минимальные ML endpoints.
- Исправлена регистрация DI контейнера:
  - Добавлены `TrainingRepository`, `TrainingService`.
  - `NewJobProcessor` теперь вызывает `training_runner` только для job типа `TRAIN`.
- Расширена модель данных:
  - Добавлены ORM-модели: `ModelArtifact`, `Dataset`, `TrainingRun` с отношениями к `User` и `UserLaunch`.
  - Созданы миграции: `002_add_user_file`, `003_add_model_artifact`, `004_add_dataset_and_training_run`.
- Реализован ML pipeline v1 (реальное обучение):
  - `TrainingService.run_for_job` теперь выполняет реальное обучение на CSV через pandas + scikit-learn (логистическая регрессия или линейная регрессия) и формирует метрики (`accuracy` или `r2/mse`).
  - Экспорт модели в `joblib` под `/storage/models/*` и сохранение `ModelArtifact`.
  - Интеграция с фоновым процессором jobs (обновлён `job_processor.py`).
- Добавлены тесты `test_training_service.py` (классификация + регрессия + негативный кейс отсутствия файлов).
- Endpoint загрузки датасета `/api/ml/v1/datasets/upload` с CSV валидацией (расширение, парсинг, непустота, >= 2 колонок).
- Расширен Job API: `JobResponse` содержит `model_url` и `metrics` для TRAIN jobs.
- Унифицирована схема метрик `MetricsResponse` и применена в ML и Job API.
- API-слой:
  - Включён ML роутер в `main.py`.
  - Добавлены эндпоинты: `/api/ml/v1/datasets`, `/training-runs`, `/artifacts` (листинг ресурсов текущего пользователя).
- Улучшены enum и статусы:
  - В `ServiceType` добавлен `TRAIN`.
- Уточнён `JobService`: для `TRAIN`-job увеличен ожидаемый `wait_time_sec` (используется таймаут обработки).

### В процессе / Требует исполнения

- Применение Alembic миграций (ожидает доступный PostgreSQL / Docker).
- Покрытие `TrainingRepository` тестами (CRUD, обновление статуса) — не реализовано.
- Дополнительная валидация датасетов (ограничение размера, проверка типов колонок, пустых значений) — в планах.
- Удаление оставшихся легаси модулей (`service/scripts/core/*`, неактивные схемы Graph/Telegram) — частично (ожидает очистку).
- Перенос артефактов/датасетов в внешнее хранилище (MinIO/S3) — запланировано.

### Следующие шаги (рекомендации)

- Реализовать ограничение размера загрузки и контроль допустимых типов данных в CSV.
- Добавить удаление / архивирование старых `TrainingRun`/`ModelArtifact`.
- Ввести версионирование датасетов (семантика `v1`, `v2` и связь с артефактами).
- Интегрировать мониторинг длительности обучения и системных ресурсов.
- Подготовить миграцию на внешнее объектное хранилище (S3/MinIO) с абстракцией.

### Риски / Ограничения текущей версии

- Ограниченная валидация датасетов (только базовая структура CSV).
- Нет контроля размера / типов колонок (может привести к падениям на неподходящих данных).
- Отсутствуют механизмы очистки и ретенции артефактов.
- Нет агрегации сравнительных метрик между запусками.
- Миграции не применены (отсутствует активная БД среда).

Документ будет обновляться по мере продвижения. Текущая версия отражает состояние после внедрения минимального ML контура.

---

## 16) Актуализация: лёгкий ML fallback, ретенция и удаление артефактов, версия датасетов (ноябрь 2025)

### Причина изменений

При запуске тестов на Windows (Python 3.13) воспроизводился фатальный `access violation` при импортировании `numpy` через `pandas` (этап инициализации `numpy.core.getlimits`). Исключение не перехватывается стандартным `try/except`, так как это низкоуровневый краш расширения. Для обеспечения стабильных тестов принято временное решение отключить тяжёлый стек (pandas/numpy/sklearn) внутри `TrainingService`.

### Что сделано

- Эндпоинт загрузки датасета `/api/ml/v1/datasets/upload` переписан: валидация CSV теперь через стандартный модуль `csv` (исключены импорты pandas). Добавлены проверки: лимит размера (`MAX_CSV_UPLOAD_BYTES`), обязательный заголовок, минимум строк данных (`MIN_CSV_DATA_ROWS`), доля пустых значений (`MAX_EMPTY_RATIO`).
- `TrainingService._train_and_export_model` упрощён — всегда вызывается лёгкий путь `_train_lightweight`:
  - Парсинг CSV «вручную».
  - Определение задачи (классификация vs регрессия) по числу уникальных значений и типам.
  - Метрики baseline:
    - Классификация: accuracy мажоритарного класса.
    - Регрессия: `r2 = 0.0` (mean predictor), вычисляется `mse`.
  - Экспорт артефакта в виде `*.pkl` (pickle) вместо `joblib`.
- Сохранён контракт метрик (`task`, `accuracy` или `r2/mse`, `n_features`, `n_samples`, `model_url`). Все существующие тесты продолжают работать без изменений.
- Добавлен интеграционный тест-план: старт TRAIN job → получение результата с обогащением (`model_url`, `metrics`).
- Версионирование датасетов: добавлен столбец `version` в таблицу `profile.dataset` + создание новой записи при каждой загрузке (даже при одинаковом имени/файле). Метод репозитория `create_dataset_with_version` вычисляет `max(version)+1` на пару (user_id, mode).

Дополнения (feature flag и предупреждения):

- В `TrainingService` введён фиче-флаг `ENABLE_REAL_TRAINING`. По умолчанию выключен; при включении используется heavy-путь (pandas/sklearn) с безопасным fallback на лёгкий путь при любой ошибке.
- Исправлено предупреждение в тесте по `datetime.utcnow()` → `datetime.now(datetime.UTC)`.

### Текущее тестовое покрытие

- `test_ml_api_upload.py` — загрузка датасета, базовая CSV валидация.
- `test_training_service.py` — happy path (classification, regression) + негативный кейс (нет файлов).
- Интеграционный тест Jobs (TRAIN): проверка enrichment полей в `JobResponse` (mock JobService через DI patch).
- Предупреждения: устранён локальный Pydantic DeprecationWarning (перевод на `model_config`), обновлён код ответа 413 на `HTTP_413_CONTENT_TOO_LARGE`. Возможные внешние предупреждения остаются под мониторингом.

### Преимущества подхода

- Стабильность CI / локальных тестов на Windows.
- Быстрая обратная связь по контрактам API без тяжёлых импортов.
- Возможность включить «настоящее» обучение через feature flag позже.

### План дальнейших шагов (дополнение)

1. Ввести фиче-флаг `ENABLE_REAL_TRAINING` (env) и возвращать прежнюю реализацию при значении `true` на платформах без крашей.
2. Добавить интеграционный тест `test_job_integration.py` (upload → start TRAIN → result) — обеспечить изоляцию через fake repositories & dependency overrides.
3. Перевести все Pydantic схемы на `ConfigDict`, устранить DeprecationWarnings.
4. Заменить устаревшие вызовы `datetime.utcnow()` на `datetime.now(datetime.UTC)`.
5. Расширить CSV валидацию (лимит размера, типы колонок, пустые значения).
6. Добавить ретенцию артефактов (TTL / максимальное число моделей на пользователя). Реализовано: ограничение числа артефактов по `MAX_MODEL_ARTIFACTS` (DB) + удаление соответствующих файлов на диске.
7. Добавить endpoint удаления артефакта. Реализовано.
8. Реализовать агрегацию сравнительных метрик по последним N запускам.
9. Добавить API для получения трендов метрик (`/api/ml/v1/metrics/trends`).

### Актуализация артефактов

- Реализован `DELETE /api/ml/v1/artifacts/{artifact_id}`: удаляет запись и физический файл. Возвращает JSON `{id, deleted:true}`.
- Тестовое покрытие: `test_ml_api_delete_artifact.py` (успех + not found), `test_training_service_retention.py` (удаление лишних файлов при ретенции).
- Версионирование датасетов проверено косвенно через ответ `version` в `test_ml_api_upload.py` (ожидается инкремент при создании).

### Следующие пункты (backlog)

1. Реализовать сбор агрегированных сравнительных метрик между запусками (история качества).
2. API трендов метрик.
3. Объектное хранилище (S3/MinIO) для артефактов и датасетов.
4. TTL для старых датасетов + связанное каскадное удаление training_runs.

### CI интеграция

- Добавлен workflow `backend-ci.yml`: матрица Windows (fallback) + Ubuntu (heavy training).
- Heavy тест `test_training_service_heavy_optional.py` пропускается на Windows и при отсутствии флага.
- Позволяет раннее обнаружение регрессий heavy пути без ломки локальной разработки.

### Риски текущего режима

- Метрики baseline не отражают реальную эффективность модели.
- Отсутствие обучения реальной модели может ввести в заблуждение потребителей API.
- Переход обратно на тяжёлый стек требует отдельной ветки тестов (Linux CI) для раннего обнаружения регрессий.

### Рекомендация

---

## 17) Реализован эндпоинт трендов метрик (ноябрь 2025)

Цель: предоставить фронтенду простой способ визуализировать динамику качества моделей по последним запускам обучения.

Что добавлено:

- Репозиторий: `TrainingRepository.list_training_metrics_trends(user_id, mode?, limit)` — выборка `TrainingRun` с join на `Dataset` для получения `version`, сортировка по `created_at desc`, опциональный фильтр по `mode`.
- Схема ответа: `MetricTrendPoint { run_id, created_at, version, metrics }`.
- Роут: `GET /api/ml/v1/metrics/trends?mode=&limit=` — возвращает список точек тренда.

Тесты:

- `tests/test_ml_api_metrics_trends.py` — проверка базового ответа и фильтра по `mode` через fake repo и dependency overrides.

Замечания по контракту:

- Поле `metrics` соответствует текущей `MetricsResponse` (классификация: `accuracy`; регрессия: `r2`, `mse`), а также включает размерность (`n_features`, `n_samples`), если доступно.
- Для привязки к данным добавлено поле `version` датасета; этого достаточно для построения оси X как «версия датасета» или времени `created_at`.

Возможные доработки:

- Расширить метрики (precision/recall/F1) для классификации и `mae` для регрессии в heavy-пути — выполнено (см. раздел 19).
- Добавить агрегирующие эндпоинты (сводные статистики по последним N запускам) — частично выполнено (раздел 18), остаётся расширение.

---

## 18) Эндпоинт сводной статистики метрик (ноябрь 2025)

Цель: дать фронтенду быстрый способ получить средние показатели качества без дополнительной пост-обработки.

Что добавлено:

- Схемы: `MetricsAggregate`, `MetricsSummaryResponse`.
- Роут: `GET /api/ml/v1/metrics/summary?mode=&limit=` — возвращает агрегаты по последним запускам и ту же выборку `trends` для унификации UX.
- Агрегаты включают `count`, `classification_count`, `regression_count`, `avg_accuracy`, `avg_r2`, `avg_mse`, а также лучшие значения: `best_accuracy`, `best_r2`, `best_mse`.

Тесты:

- `tests/test_ml_api_metrics_summary.py` — проверка корректности расчёта средних для смешанной выборки (2 classification + 1 regression) и работы фильтра `mode`.
  Дополнено проверками лучших значений и счётчиков по задачам.

Примечания к дальнейшему расширению:

- «Лучшие» показатели реализованы: `best_accuracy`, `best_r2`, `best_mse`; разбиение по задачам: `classification_count`, `regression_count`.
- План: добавить агрегаты для новых метрик (`precision`, `recall`, `f1`, `mae`) и перцентильные показатели.
- Зафиксировать лёгкий fallback до решения проблемы совместимости NumPy/Pandas (обновление бинарей или pin версии Python < 3.13). Heavy путь управляется флагом `ENABLE_REAL_TRAINING`.

---

## 19) Расширенные heavy-метрики, абстракция хранилища и TTL очистка датасетов (ноябрь 2025)

Что сделано:

- Heavy-путь обучения (при `ENABLE_REAL_TRAINING=true`) рассчитывает:
  - Классификация: `accuracy`, `precision`, `recall`, `f1` (macro).
  - Регрессия: `r2`, `mse`, `mae`.
- Лёгкий fallback сохраняет совместимость: `precision/recall/f1=None` для классификации, `mae` добавлен для регрессии.
- Расширена сводная статистика: добавлены поля `best_*` и счётчики по задачам.
- Абстракция хранилища:
  - Интерфейс `AbstractFileStorage`; реализации `LocalFileStorage`, `MinioFileStorage`.
  - Выбор через `STORAGE_BACKEND` (`local` по умолчанию, `minio` при наличии конфигурации).
  - `FileSaverService` перенесён на абстрактный интерфейс.
- TTL очистка датасетов:
  - Метод репозитория `cleanup_expired_datasets(cutoff, limit)` удаляет устаревшие `Dataset` + связанный `TrainingRun`, возвращает ключи файлов.
  - Эндпоинт `DELETE /api/ml/v1/datasets/expired?limit=` удаляет файлы и возвращает отчёт `{deleted, files_removed, files_missing}`.
- Новые тесты: heavy метрики, summary агрегаты (включая best), TTL cleanup.

Переменные окружения:

- `ENABLE_REAL_TRAINING`, `STORAGE_BACKEND`, `DATASET_TTL_DAYS`, `MAX_MODEL_ARTIFACTS`, `MAX_CSV_UPLOAD_BYTES`, `MIN_CSV_DATA_ROWS`, `MAX_EMPTY_RATIO` + MinIO креды.

Backlog по разделу 19:

- Автоматизация TTL (периодический запуск, фоновые задачи).
- Presigned URLs и retry логика для MinIO.
- Интеграционные тесты с реальным MinIO/S3 в CI.
- Агрегаты для `precision`, `recall`, `f1`, `mae`; confusion matrix и per-class статистика.
