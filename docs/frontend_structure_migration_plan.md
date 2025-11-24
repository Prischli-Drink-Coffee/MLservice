# План перехода на единую структуру компонентов фронтенда

## Цели
- Свести текущие директории `components` и `features` к единой иерархии, чтобы каждый экран собирался в одном месте.
- Выделить библиотеку общих UI-компонентов, которые легко настраиваются через props и не зависят от конкретной страницы.
- Хранить специализированные блоки строго внутри папок соответствующих features, избегая дублирования между `components/*` и `features/*`.
- Собрать итоговые страницы в отдельной зоне, где явно видно, какие блоки и контроллеры используются.

## Текущая ситуация (краткий аудит)
- `src/components/common` содержит реальные шаред-примитивы (кнопки, карточки, типографика, модальные окна) — их нужно сохранить как "общую библиотеку".
- `src/components/{home,datasets,profile,auth}` держат **фиче-зависимые** куски, которые дублируют содержимое `src/features/*/components`.
- `src/features/*` уже имеют контроллеры и некоторую разметку, но часть визуальных блоков находится в `components/*` и импортируется напрямую, что ломает гранулярность.

## Целевая структура
```
frontend/src/
  ui/                      # общие компоненты (бывший components/common + layout + shared модалки)
    atoms/
    molecules/
    organisms/
    layout/
  features/
    home/
      components/
      hooks/
      index.js
    datasets/
      components/
      hooks/
      index.js
    profile/
      components/
      hooks/
      index.js
    auth/
      components/
      hooks/
      index.js
    ... (artifacts, metrics, trainingRuns, info)
  pages/
    home/                  # сборка страницы: подключение контроллеров и спец. компонентов
      HomePage.jsx
      index.js             # реэкспорт для router
    datasets/
      DatasetsPage.jsx
      index.js
    ...
```

### Классификация существующих компонентов
| Текущий путь | Категория | Новое место |
|--------------|-----------|-------------|
| `components/common/*` | Общие UI | `ui/{atoms|molecules|layout}` (например `PrimaryButton` → `ui/atoms/PrimaryButton.jsx`) |
| `components/layout/*` | Общие layout | `ui/layout/*` |
| `components/auth/*` | Фича "auth" (формы) | `features/auth/components/*` |
| `components/datasets/*` | Фича "datasets" | `features/datasets/components/*` |
| `components/home/*` | Фича "home" | `features/home/components/*` (частично уже есть, нужно слить) |
| `components/profile/*` | Фича "profile" | `features/profile/components/*` |

## Поэтапный план миграции
1. **Подготовка `ui/`**
   - Создать `src/ui` с подпапками `atoms`, `molecules`, `organisms`, `layout`.
   - Переместить содержимое `components/common` и `components/layout` в соответствующие подпапки.
   - Привести API общих компонентов к prop-first подходу (default props, возможность кастомизировать размеры/цвета).
   - Обновить все импорты по проекту.

2. **Интеграция feature-компонентов**
   - Для каждой страницы (home, datasets, profile, auth, artifacts, metrics, trainingRuns, info) перенести содержимое `components/<feature>` в `features/<feature>/components`.
   - Обновить barrel-файлы `features/<feature>/index.js`, чтобы экспортировать все, что нужно страницам.
   - Убедиться, что контроллеры (`use<X>Controller`) живут рядом с компонентами.

3. **Сборка страниц**
   - В `src/pages` создать подпапку для каждой страницы (например, `pages/home/HomePage.jsx`).
   - Внутри каждой страницы подключать только:
     - контроллер(ы) из `features/<feature>`;
     - визуальные блоки из `features/<feature>/components`;
     - шаред-компоненты из `ui/*`.
   - Поддержать barrel `src/pages/index.js` для экспорта страниц в router.

4. **Удаление старых директорий**
   - После успешной миграции удалить `src/components/{home,datasets,profile,auth}` и пустую `components/common`.
   - Настроить ESLint либо tsconfig path aliases (`@ui`, `@features/*`) для удобства.

## Требования к общим компонентам
- Каждый общий компонент должен принимать `className`, `...rest` и/или override-пропы (например, размеры, иконки).
- Не допускается жёстко захардкоженный текст внутри `ui`-компонентов.
- Компонент обязан документировать ключевые пропсы (PropTypes или JSDoc) и иметь дефолтное состояние.

## Проверки после миграции
1. `npm run lint` и `npm test` — убеждаемся, что импорты обновлены.
2. Вручную проверить основные страницы (Home, Datasets, Profile) на отсутствие регресса.
3. Обновить документацию (README/Architecture) ссылкой на новую структуру.

## Дополнительные рекомендации
- Ввести алиасы импорта (`@ui`, `@features/home`) через `jsconfig.json`, чтобы пути не росли.
- Рассмотреть Storybook/Chromatic для общих компонентов после переноса.
- Для крупных блоков (например, HeroSection) рассмотреть деление на под-компоненты внутри feature.
