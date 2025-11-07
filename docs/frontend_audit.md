# Frontend: аудит и план адаптации под текущий ML backend

Ниже — инвентаризация текущего фронтенда (наследие Graph/Telegram проекта), сопоставление с актуальным ML backend (разделы 15–22 backend_audit.md) и поэтапный план трансформации UI и API-слоя под новые эндпоинты.

---

## 1) Текущее состояние фронтенда (обзор)

Стек: React + Chakra UI, hash-router (на старте), модульный API-слой на axios (`src/API`).

Ключевые особенности:

- Страницы и компоненты вокруг графов/телеграма: `GraphsPage`, `GraphBuilderPage`, `GraphDetailPage`, `NodeRegistryPage`, `TelegramPage`.
- API-модули: `graphs.js`, `telegram.js`, `stats.js`, `auth.js`; общий клиент `client.js` с `withCredentials=true` и cookie-базированной сессией.
- Экспорт страниц (`pages/index.js`) содержал несуществующий `PlaygroundPage` (исправлено).
- Вспомогательные service'ы на старые маршруты (`API/services/*`) и отдельный cookie-хелпер с Bearer-токеном (не используется основным axios-клиентом, т.к. cookie-сессия).

Вывод: UI и слой API ориентированы на домен Graph/Telegram, которого больше нет на бэкенде.

---

## 2) Целевой backend API (ML v1)

Доступные ресурсы согласно backend_audit.md и коду `service/presentation/routers/ml_api/ml_api.py`:

- Datasets:
  - GET `/api/ml/v1/datasets?limit=` — список датасетов пользователя
  - POST `/api/ml/v1/datasets/upload` — загрузка CSV (multipart/form-data, field `file`)
  - DELETE `/api/ml/v1/datasets/expired?limit=` — TTL очистка (админ/скрытый пункт меню)
- Files:
  - GET `/api/ml/v1/files/{file_id}/download-url?expiry_sec=` — presigned URL (если поддерживается)
- Training runs:
  - GET `/api/ml/v1/training-runs?limit=` — список запусков с метриками
- Model artifacts:
  - GET `/api/ml/v1/artifacts?limit=` — список артефактов
  - DELETE `/api/ml/v1/artifacts/{artifact_id}` — удаление (каскадно удаляет файл)
- Metrics:
  - GET `/api/ml/v1/metrics/trends?limit=` — точки тренда метрик (включая `version` датасета)
  - GET `/api/ml/v1/metrics/summary?limit=` — агрегаты (avg/best/count) + те же trend-пункты

Авторизация: cookie-сессия (совместима с текущим axios-клиентом). Публичные эндпоинты: `/api/health` (метрики публичные — защищённые).

---

## 3) Маппинг старых страниц → новые разделы

Удаляем (легаси):

- Graphs: `GraphsPage`, `GraphDetailPage`, `GraphBuilderPage`, `NodeRegistryPage`
- Telegram: `TelegramPage`
- Stats v1: `stats.js` (платформенная статистика) — бэкенд удалён

Добавляем/заменяем:

- DatasetsPage: загрузка CSV + список датасетов (версионирование отображаем как `v{version}`)
- TrainingRunsPage: список запусков обучения, базовые метрики и статус
- ArtifactsPage: список моделей (скачивание/удаление)
- MetricsPage: графики по `/metrics/trends` + блок сводки `/metrics/summary` (avg/best)
- HomePage: сводка метрик (упрощённая) + быстрые действия (Загрузить датасет)

Маршруты (на старте hash-router, далее browser history после настройки nginx fallback):

- `#/datasets`, `#/training`, `#/artifacts`, `#/metrics`, `#/` (Home)

---

## 4) API-слой: новые модули и контракты

Созданы новые файлы в `src/API`:

- `datasets.js` — list/upload/cleanupExpired
- `training.js` — listTrainingRuns
- `artifacts.js` — listArtifacts/deleteArtifact
- `metrics.js` — getMetricsTrends/getMetricsSummary
- `files.js` — getFileDownloadUrl

Контракты (сжатая форма):

- Dataset: `{ id, name, file_url, version, created_at, download_url? }`
- TrainingRun: `{ id, created_at, dataset_id?, metrics? }`
- ModelArtifact: `{ id, created_at, model_url, metrics? }`
- Metrics (classification): `{ task:"classification", accuracy, precision?, recall?, f1?, n_features?, n_samples?, confusion_matrix? }`
- Metrics (regression): `{ task:"regression", r2, mse, mae?, n_features?, n_samples? }`
- Trends point: `{ run_id, created_at, version, metrics }`
- Summary: `{ aggregates: { count, avg_* , best_*, classification_count?, regression_count? }, trends: TrendPoint[] }`

Загрузка CSV: `Content-Type: multipart/form-data`, поле `file`. Подсказки по формату и лимитам показаны в UI.

---

## 5) Навигация/меню и каркас страниц

- Пункты меню: Датасеты, Обучение, Артефакты, Метрики (и Главная | Войти/Выйти)
- Компонентные блоки:
  - FileUpload (кнопка выбора файла) → вызывает `uploadDataset`
  - MetricsSummaryCard (плитка avg/best)
  - MetricsTrendChart (добавить Recharts)
  - DataTable (таблица для датасетов/запусков/артефактов)

---

## 6) Auth и обработка 401

- Cookie-сессия сохранена. В `client.js` оставлен только `/api/health` в PUBLIC_ENDPOINTS.
- Login/SignUp — без изменений (`/api/auth/v1`).

---

## 7) Env и конфигурация

- `REACT_APP_API_BASE_URL` — оставить (по умолчанию "/").
- Перейти на Browser History после добавления nginx fallback (location / { try_files $uri /index.html; }).

---

## 8) Ошибки и совместимость

- Удалён экспорт несуществующей страницы `PlaygroundPage`.
- `API/services/*` с Bearer — к удалению после зачистки легаси.

---

## 9) Поэтапный план работ (MVP → улучшения)

Этап 1 (MVP):

1. [x] Добавить новые API-модули (`datasets.js`, `training.js`, `artifacts.js`, `metrics.js`, `files.js`) и экспорт из `API/index.js`.
2. [x] Обновить `client.js`: убрать `/api/stats/v1/platform` из `PUBLIC_ENDPOINTS`.
3. [x] Создать каркас страниц: `DatasetsPage`, `TrainingRunsPage`, `ArtifactsPage`, `MetricsPage`.
4. [x] Обновить роутинг и меню — убрать Graph/Telegram.

Этап 2 (Функциональность):

5. [x] Загрузка CSV, список датасетов, версия/дата и `download_url`.
6. [x] TrainingRuns: таблица запусков и метрики.
7. [x] Artifacts: таблица, удаление, ссылка на модель.
8. [x] Metrics: карточки сводки и тренд (таблица).

Этап 3 (UX/графики/администрирование):

9. [x] Добавить красивые графики (Recharts) для трендов — реализованы LineChart по accuracy и r2.
10. [x] TTL cleanup (кнопка для администратора) с отчётом — компонент `TTLCleanupCard` за флагом `REACT_APP_ENABLE_ADMIN_UI`.
11. [x] Перейти на Browser History и добавить nginx fallback — переключено на `createBrowserRouter`, SPA fallback присутствует в `frontend/nginx.conf` (`try_files $uri /index.html`).

Этап 4 (зачистка):

12. [ ] Полностью удалить легаси Graph/Telegram страницы и API-модули.
13. [ ] Удалить `API/services/*` и cookie-хелперы Bearer.

Примечание: временно легаси файлы (Graph/Telegram) физически не удалены, но исключены из lint посредством `ignores` в `eslint.config.cjs` (flat config). Это предотвращает шум до полной зачистки.

---

## 10) Риски и ограничения

- Heavy-метрики могут быть `null` на Windows — UI показывает N/A без предупреждений.
- Большие CSV → 413; показаны подсказки и дружелюбные ошибки.

---

## 11) Acceptance (готовность MVP)

- [x] Навигация содержит только ML-разделы.
- [x] Загрузка CSV успешна, видно новый элемент с версией и ссылкой.
- [x] Метрики: сводка и тренды рендерятся без ошибок.
- [x] Удаление артефакта обновляет список.
- [x] 401 корректно разлогинивает.
