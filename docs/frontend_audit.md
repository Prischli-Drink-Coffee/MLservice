# Frontend: аудит и план адаптации под текущий ML backend

Ниже — инвентаризация текущего фронтенда (наследие Graph/Telegram проекта), сопоставление с актуальным ML backend (разделы 15–22 backend_audit.md) и поэтапный план трансформации UI и API-слоя под новые эндпоинты.

---

## 1) Текущее состояние фронтенда (обзор)

Стек: React + Chakra UI, hash-router, модульный API-слой на axios (`src/API`).

Ключевые особенности:
- Страницы и компоненты вокруг графов/телеграма: `GraphsPage`, `GraphBuilderPage`, `GraphDetailPage`, `NodeRegistryPage`, `TelegramPage`.
- API-модули: `graphs.js`, `telegram.js`, `stats.js`, `auth.js`; общий клиент `client.js` с `withCredentials=true` и cookie-базированной сессией.
- Экспорт страниц (`pages/index.js`) содержит несуществующий `PlaygroundPage` (мелкая несогласованность).
- Вспомогательные service'ы на старые маршруты (`API/services/*`) и отдельный cookie-хелпер с Bearer-токеном (не используется основным axios-клиентом, т.к. cookie-сессия).

Вывод: UI и слой API ориентированы на домен Graph/Telegram, которого больше нет на бэкенде.

---

## 2) Целевой backend API (ML v1)

Доступные ресурсы согласно backend_audit.md и коду `service/presentation/routers/ml_api/ml_api.py`:
- Datasets:
  - GET `/api/ml/v1/datasets?limit=` — список датасетов пользователя
  - POST `/api/ml/v1/datasets/upload?mode=` — загрузка CSV (multipart/form-data, field `file`)
  - DELETE `/api/ml/v1/datasets/expired?limit=` — TTL очистка (админ/скрытый пункт меню)
- Files:
  - GET `/api/ml/v1/files/{file_id}/download-url?expiry_sec=` — presigned URL (если поддерживается)
- Training runs:
  - GET `/api/ml/v1/training-runs?limit=` — список запусков с метриками
- Model artifacts:
  - GET `/api/ml/v1/artifacts?limit=` — список артефактов
  - DELETE `/api/ml/v1/artifacts/{artifact_id}` — удаление (каскадно удаляет файл)
- Metrics:
  - GET `/api/ml/v1/metrics/trends?mode=&limit=` — точки тренда метрик (включая `version` датасета)
  - GET `/api/ml/v1/metrics/summary?mode=&limit=` — агрегаты (avg/best/count) + те же trend-пункты

Авторизация: cookie-сессия (совместима с текущим axios-клиентом). Публичные эндпоинты: `/api/health` (метрики публичные — защищённые).

---

## 3) Маппинг старых страниц → новые разделы

Удаляем/прячем (легаси):
- Graphs: `GraphsPage`, `GraphDetailPage`, `GraphBuilderPage`, `NodeRegistryPage`
- Telegram: `TelegramPage`
- Stats v1: `stats.js` (платформенная статистика) — бэкенд удалён

Добавляем/заменяем:
- DatasetsPage: загрузка CSV + список датасетов (версионирование отображаем как `v{version}`)
- TrainingRunsPage: список запусков обучения, базовые метрики и статус
- ArtifactsPage: список моделей (скачивание/удаление)
- MetricsPage: графики по `/metrics/trends` + блок сводки `/metrics/summary` (avg/best)
- HomePage: сводка метрик (упрощённая) + быстрые действия (Загрузить датасет)

Маршруты (пример hash-router):
- `#/datasets`, `#/training`, `#/artifacts`, `#/metrics`, `#/` (Home)

---

## 4) API-слой: новые модули и контракты

Создаём новые файлы в `src/API` (см. черновики реализованы):
- `datasets.js` — list/upload/cleanupExpired
- `training.js` — listTrainingRuns
- `artifacts.js` — listArtifacts/deleteArtifact
- `metrics.js` — getMetricsTrends/getMetricsSummary
- `files.js` — getFileDownloadUrl

Контракты (сжатая форма):
- Dataset: `{ id, name, file_url, mode, version, created_at, download_url? }`
- TrainingRun: `{ id, created_at, dataset_id?, metrics? }`
- ModelArtifact: `{ id, created_at, model_url, metrics? }`
- Metrics (classification): `{ task:"classification", accuracy, precision?, recall?, f1?, n_features?, n_samples?, confusion_matrix? }`
- Metrics (regression): `{ task:"regression", r2, mse, mae?, n_features?, n_samples? }`
- Trends point: `{ run_id, created_at, version, metrics }`
- Summary: `{ aggregates: { count, avg_* , best_*, classification_count?, regression_count? }, trends: TrendPoint[] }`

Загрузка CSV: `Content-Type: multipart/form-data`, поле `file`, query `mode` (например, `LIPS`).

---

## 5) Навигация/меню и каркас страниц

- Заменить пункты меню на: Datasets, Training, Artifacts, Metrics (и Home | Login/Logout)
- Компонентные блоки (переиспользуемые):
  - FileUpload (drag&drop или обычная кнопка) → вызывает `uploadDataset`
  - MetricsSummaryCard (плитка avg/best для нужных полей)
  - MetricsTrendChart (линии/столбцы; можно начать с таблички и добавить график позже)
  - DataTable (таблица для датасетов/запусков/артефактов)

---

## 6) Auth и обработка 401

- Сохраняем cookie-сессию. Пара `PUBLIC_ENDPOINTS` в `client.js` — оставить `/api/health` и удалить `/api/stats/v1/platform` (нет на бэкенде), чтобы некорректные 401 по защищённым ресурсам корректно разлогинивали.
- Страницы Login/SignUp — оставить, API `/api/auth/v1/login|register` актуален.

---

## 7) Env и конфигурация

- `REACT_APP_API_BASE_URL` — оставить (по умолчанию "/").
- Добавить `REACT_APP_DEFAULT_MODE` (напр. `LIPS`) как дефолт для загрузки датасета.
- В будущем — флаги отображения heavy-метрик (опционально, завязать на `/metrics/summary`).

---

## 8) Ошибки и совместимость

- Удалить зависимость на `stats.js` (платформенная статистика) — заменить блок на сводку ML-метрик.
- Исправить экспорт несуществующей страницы: `pages/index.js` содержит `PlaygroundPage`, файла нет.
- `API/services/*` c Bearer-токенами — не использовать (сессии — cookies). Пометить к удалению после миграции UI.

---

## 9) Поэтапный план работ (MVP → улучшения)

Этап 1 (MVP, без риска):
1. Добавить новые API-модули (`datasets.js`, `training.js`, `artifacts.js`, `metrics.js`, `files.js`) и экспорт из `API/index.js`.
2. Обновить `client.js`: убрать `/api/stats/v1/platform` из `PUBLIC_ENDPOINTS`.
3. Создать каркас страниц (пустые контейнеры с заголовками и использованием API): `DatasetsPage`, `TrainingRunsPage`, `ArtifactsPage`, `MetricsPage`.
4. Обновить роутинг и меню — скрыть Graph/Telegram страницы (временно оставить код, но убрать из навигации).

Этап 2 (Функциональность):
5. Реализовать загрузку CSV, список датасетов, отображение версии/даты и presigned `download_url`.
6. TrainingRuns: таблица запусков и отображение метрик (динамично — в зависимости от задачи).
7. Artifacts: таблица с `model_url` и удалением артефактов.
8. Metrics: карточки сводки (avg/best) и трендовая таблица (графики — по возможности).

Этап 3 (UX/ретенция):
9. Добавить фильтр по `mode` и `limit` на страницах.
10. Добавить TTL cleanup (кнопка для админа) с отчётом по удалённым файлам.
11. Локализация ошибок/валидаторов загрузки (413 слишком большой, 400 формат и пр.).

Этап 4 (зачистка):
12. Удалить легаси Graph/Telegram страницы и API-модули после подтверждения бизнесом.
13. Удалить `API/services/*` и неиспользуемые хелперы Bearer-токена.

---

## 10) Риски и ограничения

- На Windows возможен heavy-путь отключён на бэкенде (fallback-метрики) — UI должен устойчиво работать с `null` для `precision/recall/f1/mae`.
- Большие CSV → 413; показать пользователю дружелюбную подсказку по лимиту (`MAX_CSV_UPLOAD_BYTES`).
- Авторизация cookie: убедиться, что nginx/домен настроены на передачу cookie (SameSite/Lax).

---

## 11) Acceptance (готовность MVP)

- Навигация содержит только ML-разделы.
- Загрузка CSV успешна, в списке датасетов видно новый элемент с версией и ссылкой для скачивания.
- Отдаются тренды и сводка метрик, страницы рендерят значения без ошибок.
- Удаление артефакта успешно и обновляет список.
- 401 на защищённых эндпоинтах приводит к корректному логауту.

---

## 12) Точки контроля кода (быстрые правки)

- [ ] Удалить `/api/stats/v1/platform` из `PUBLIC_ENDPOINTS` (`src/API/client.js`).
- [x] Добавить новые API-модули (созданы черновики функций) и экспортировать в `src/API/index.js`.
- [ ] Обновить `pages/index.js` — убрать `PlaygroundPage` и старые граф/телеграм-страницы из экспорта и роутинга.
- [ ] Добавить каркас страниц ML и пунктов меню.

Документ будет обновляться по мере выполнения этапов.
