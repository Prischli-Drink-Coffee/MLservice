## MLservice Design System — Dark Aurora

### 1. Palette & Surfaces
| Token | Hex/Description | Usage |
| --- | --- | --- |
| `colors.background.darkPrimary` | `#050505` | Базовый фон приложения, используется в `body` и ProtectedLayout |
| `colors.blur.dark` / `colors.blur.mid` | rgba(21,21,21,0.75) / rgba(53,53,53,0.75) | Стеклянные панели, поисковые блоки |
| `gradients.prism` | linear-gradient(120deg, #2f74ff → #8b5cf6 → #158f6e) | CTA, активные бейджи, подсветка активного nav |
| `gradients.midnightMesh` | Сетка радужных пятен | Подложка карточек и лэйаутов |
| `borderColor` tokens | rgba(255,255,255,0.05…0.12) | Разделители и рамки |

**Guidelines**
- Не использовать чистый черный (#000). Минимальная яркость — `#050505`.
- Все стеклянные панели состоят из трёх слоёв: фон (blur), внутренний градиент (5–10% opacity) и мягкая тень (`0 30px 80px rgba(3,4,8,0.55)`).

### 2. Typography
| Role | Token | Size / Line-height / Weight |
| --- | --- | --- |
| Display | `typography.title.large` | 30–52px / 1.15 / 500 |
| Section title | `title.medium` | 24–32px / 1.25 / 500 |
| Subtitle | `subtitle.medium` | 16–20px / 1.25 / 500 |
| Body | `body.large` / `body.medium` | 18 / 14px | 1.4–1.5 |
| Footnote | `footnote.small` | 12px / 1.25 / 500 |

**Guidelines**
- Заголовки не изменяем вручную. Используем `Title`, `Subtitle`, `Body`, `Footnote` из `@ui/atoms/Typography`.
- Максимум 2 строки для Title/Subtitle, затем метки/CTA.

### 3. Spacing & Grid
- Основная сетка: 12 колонок, gutter 24px, `Container maxW`:
  - Public pages: `6xl` (1440px, padding 48px)
  - Protected pages: `6xl` (1200px) внутри темной ленты
- Вертикальный ритм: множители `spacing.scale` (8/12/16/24/32). Минимальный отступ между секциями — 48px.
- Карточки используют внутренние отступы `spacing.xl` (32px) на десктопе и `spacing.lg` (24px) на ноутбуках.

### 4. Components
#### Header/Nav
- Высота 72px, липкий фон `rgba(5,5,5,0.75)` + градиентная граница.
- Активный пункт навигации подсвечивается `layoutId`-капсулой 12x12px на baseline текста.
- CTA: `PrimaryButton` (градиент) для основных действий, `ghost` для вторичных; никогда не смешивать в одной группе разные высоты.

#### SummaryPanel
- Сетка 3–4 карточек, каждая = стеклянная панель с border `rgba(255,255,255,0.08)` и мягким свечением (`box-shadow: 0 20px 45px rgba(0,0,0,0.35)`).
- Статистика оформляется через `Stat` (`label`, `number`, `helpText`), baseline выравнивается по горизонтали.

#### SearchBar / Inputs
- Высота 64px (`h={16}`), `InputLeftElement` = 20px иконка.
- `focus-visible` подсвечивает границу градиентом и добавляет `box-shadow: 0 0 0 1px #2f74ff`.

#### Section
- Заголовок (`Footnote` + `Title`), вторичная строка с описанием/CTA.
- Контентная область = стеклянная карточка с внутренними отступами 32px и gap 24px между внутренними блоками.

#### Empty / Error states
- `EmptyPanel`: иконка (24px) + Title + Body + CTA.
- `ErrorAlert`: градиентный бордер, фон `rgba(239,68,68,0.12)`, кнопка Retry.

### 5. States & Accessibility
- Все анимации завязаны на `prefers-reduced-motion`: при включении эффекты переходят в статические тени/opacity.
- Контраст текста ≥ 4.5:1 на ключевых элементах; вторичный текст допускает 3:1 на фоновых панелях.
- Hover/Active/Disabled состояния должны отличаться как цветом, так и яркостью.

### 6. Iconography
- Используем Chakra Icons + кастомные SVG, но приводим к одному набору размеров: 16px в тексте, 24px в карточках, 32px в hero.
- Цвет иконки = `colors.text.secondary` по умолчанию, `brand.primary` для акцентных статусов.

### 7. Deliverables
- Этот документ вместе с `frontend_full_refactor_plan.md` фиксирует текущий дизайн-язык.
- Все новые компоненты/страницы должны ссылаться на эти правила и использовать токены вместо инлайновых значений.
