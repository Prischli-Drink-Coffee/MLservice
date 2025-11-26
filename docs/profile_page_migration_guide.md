# User Profile Page — Migration Guide

**Цель**: безопасно внедрить новую страницу профиля с поддержкой редактирования данных и отображением квот, сохранив обратную совместимость и подготовив инфраструктуру для будущих платежей.

---

## 1. Пререквизиты

1. **Обновить репозиторий** до ветки `dev` (commit с backend API и страницей `/profile`).
2. **Переменные окружения**:
   - `PROFILE_DEFAULT_QUOTA=50` (используется для расчёта snapshot квоты).
   - `PROFILE_ACTIVITY_WINDOW_DAYS=14` *(готовим заранее для следующего релиза)*.
   - `PROFILE_PAYMENTS_CTA_EMAIL=payments@mlservice.ai`.
   - `ENABLE_PROFILE_PAYMENTS_UI=false` и `REACT_APP_ENABLE_PROFILE_PAYMENTS_UI=false`.
   - `TIMEZONE_WHITELIST` — опционально.
3. **Бэкенд зависимости**: `uv pip sync` (обновились модели и alembic, но без новых внешних пакетов).
4. **Фронтенд**: `npm install` не обязателен, но рекомендуется для синхронизации lock-файла.

---

## 2. Шаги миграции (staging → production)

### Шаг 1. Схема данных
1. Применить alembic-миграцию `008_add_profile_optional_fields` (добавляет `company`, `timezone`, `avatar_url`).
2. Дополнительная таблица квот **не создаётся** — пока используем `available_launches` из `users`.
3. Санити-обновление (опционально):
   ```sql
   UPDATE profile."user"
   SET timezone = COALESCE(timezone, 'UTC')
   WHERE timezone IS NULL;
   ```

### Шаг 2. Backend rollout
1. Перезапустить backend с новыми env.
2. Проверить ручки (Swagger/Postman):
   - `GET /api/profile/me`
   - `PATCH /api/profile/me`
   - `GET /api/billing/quotas/preview`
3. Синхронизировать значения `available_launches` между API и БД.
4. Запустить `pytest backend/tests/test_profile_api.py`.
5. Логи `ProfileService` уже включены (INFO). Для будущего аудита квот будет отдельный sink.

### Шаг 3. Frontend rollout
1. `npm run build` (CRA).
2. Smoke `/profile` на dev/staging: загрузка, редактирование, ошибки сети, empty state.
3. Проверить предупреждение при `available_launches <= 5` и скрытие CTA, если `REACT_APP_ENABLE_PROFILE_PAYMENTS_UI=false`.
4. UI-тесты: `CI=true npm test -- src/__tests__/profileComponents.test.jsx`.
5. Accessibility: проверка табуляции и ловли фокуса в Drawer/Modal.

### Шаг 4. Feature flag & предупреждение
1. Backend переменная `ENABLE_PROFILE_PAYMENTS_UI` управляет выдачей тарифов (сейчас не используется, TODO).
2. Frontend флаг `REACT_APP_ENABLE_PROFILE_PAYMENTS_UI` скрывает CTA и секцию планов.
3. Порядок включения: dev → staging → prod после smoke и поддержки.

### Шаг 5. Подготовка поддержки и мониторинга
1. Support/Ops:
   - Макрос ответа для CTA → `payments@mlservice.ai`.
   - SLA: ручное расширение квоты через админ-скрипт.
2. Monitoring:
   - Алерты на `/api/profile/*` и `/api/billing/quotas/preview`.
   - Метрики `profile_view`, `profile_edit`, `profile_quota_warning_shown`.
3. QA чеклист (staging): редактирование, офлайн-режим, empty state, скрытое CTA.

### Шаг 6. Интеграция с активностью backend (следующий релиз)
1. Собрать события из `training_runs`, `datasets`, `jobs` в `ProfileActivityRepository`.
2. Добавить endpoint `GET /api/profile/activity?limit=10` + unit-тесты.
3. Прокинуть данные в `ActivityTimeline` (frontend) и обновить UI-тесты.
4. Включить `PROFILE_ACTIVITY_WINDOW_DAYS`, после smoke добавить метрику `profile_activity_events_total`.
5. Обновить документацию `docs/profile_page_*` после релиза.

---

## 3. Rollback план

| Сценарий | Действие |
| --- | --- |
| Ошибки в новых API | Откатить деплой backend на предыдущую версию, миграции оставить (они backward compatible). |
| UI ломается на prod | Отключить роут `/profile` через фичефлаг в роутере, оставить старое меню без изменения. |
| Некорректные данные квот | Установить `quota_limit = previous_limit`, включить временный скрипт синхронизации из job-сервиса. |
| Пользователи путаются из-за CTA оплаты | Временно выключить `ENABLE_PROFILE_PAYMENTS_UI` и оповестить поддержку. |

---

## 4. Пост-релизные действия

1. Собрать фидбек от первых пользователей, зафиксировать пожелания (например, больше метаданных профиля).
2. Мониторить метрики использования страницы (сколько людей нажимают CTA).
3. Подготовить техническое задание на реальную платёжную интеграцию (Stripe/Tinkoff), используя результаты исследований.
4. Дополнить документацию: FAQ для пользователей, раздел в README.

---

## 5. Часто задаваемые вопросы

- **Что будет, если пользователь не обновит данные?** — Ничего критичного, поля остаются пустыми.
- **Можно ли менять email?** — Нет, поле read-only до отдельной верификации.
- **Как формируется квота?** — По умолчанию `PROFILE_DEFAULT_QUOTA`, но можно переопределить вручную в базе или через админ-интерфейс (roadmap).
- **Что увидит пользователь при клике "Купить"?** — Модальное окно со списком планов, ценами (примерными) и предупреждением, что онлайн-оплата будет позже.
- **Нужно ли платить сейчас?** — Нет, CTA показывает инструкцию, как связаться с командой.

---

**Документ подготовлен**: GitHub Copilot, November 18, 2025
