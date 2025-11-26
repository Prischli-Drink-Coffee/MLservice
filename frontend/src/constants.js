export const PROJECT_NAME = "Forge";
export const PROJECT_VERSION = "1.0.0";
export const COMPANY_NAME = "InCellCorp";
export const PROJECT_AUTHOR = "InCellCorp Team";
export const CURRENT_YEAR = new Date().getFullYear();
export const SUPPORT_EMAIL = "info@incellcorp.ai";
export const ORG_GITHUB_URL = "https://github.com/Prischli-Drink-Coffee";
export const ORG_VK_URL = "https://vk.com/digtatordigtatorov";

export const HERO_TECH_STACK = [
  "FastAPI",
  "Alembic",
  "PostgreSQL",
  "React",
  "Chakra UI",
  "Docker",
  "Nginx",
  "Pydantic",
  "Scikit-learn",
  "Redis",
];

export const HERO_COPY = {
  brandFootnote: `${PROJECT_NAME} Platform`,
  titleHighlight: "на нашей совести",
  descriptionPrimary:
    "MLservice — это платформа для обучения ML-моделей. Загрузите данные, настройте параметры, а дальше мы сами позаботимся обо всём остальном.",
  descriptionSecondary:
    "Платформа создавалась ML инженерами для неподкованных пользователей, которым нужна надёжная инфраструктура и воспроизводимость экспериментов.",
  authenticatedPrimaryCta: { label: "Загрузить данные", to: "/datasets" },
  authenticatedSecondaryCta: { label: "Обучить модель", to: "/training" },
  guestPrimaryCta: { label: "Войти в консоль", to: "/login" },
  guestSecondaryCta: { label: "Регистрация", to: "/register" },
  guestFootnote: "После входа вы сможете обучить модель на своих данных всего в пару кликов!",
};

export const BENEFITS_CONTENT = {
  title: "Ключевые преимущества",
  subtitle: "Почему выбирают наш сервис?",
  description:
    "Наш сервис предлагает уникальные возможности для эффективного управления вашими ML-моделями и ресурсами.",
  items: [
    {
      icon: "CheckCircleIcon",
      title: "Простота использования",
      description: "Интуитивно понятный интерфейс",
      color: "brand.primary",
    },
    {
      icon: "TimeIcon",
      title: "Скорость",
      description: "Работа с классическими моделями на GPU через технологию RAPIDS",
      color: "brand.secondary",
    },
    {
      icon: "RepeatIcon",
      title: "Повторяемость",
      description: "Легкость воспроизведения результатов",
      color: "#f59e0b",
    },
    {
      icon: "LockIcon",
      title: "Безопасность",
      description: "JWT-аутентификация, изолированные окружения, SSL/TSL шифрование.",
      color: "brand.tertiary",
    },
  ],
};

export const FEATURE_SLIDES = [
  {
    id: 1,
    title: "Загрузка и верификация данных",
    description:
      "Интуитивный загрузчик позволяет быстро подтянуть CSV/изображения и автоматически валидирует схемы, размеры и ограничения качества перед добавлением в проекты.",
    badge: "Данные",
    gradient:
      "radial-gradient(circle at 20% 20%, rgba(47,116,255,0.45), rgba(139,92,246,0.25) 40%, rgba(6,11,21,0.8) 80%)",
  },
  {
    id: 2,
    title: "Тренировка моделей в пару кликов",
    description:
      "Запускайте пайплайны с адаптивными конфигурациями, мониторьте метрики обучения и мгновенно сравнивайте эксперименты в едином интерфейсе.",
    badge: "Training",
    gradient:
      "radial-gradient(circle at 80% 30%, rgba(20,184,166,0.35), rgba(47,116,255,0.2) 45%, rgba(6,11,21,0.85) 75%)",
  },
  {
    id: 3,
    title: "Хранение артефактов и метрик",
    description:
      "Версионирование моделей, графов и метрик с поддержкой MinIO и локального хранилища. Доступ по подписанным URL и интеграция с Prometheus/Graphite.",
    badge: "Артефакты",
    gradient:
      "radial-gradient(circle at 50% 60%, rgba(244,114,182,0.35), rgba(47,116,255,0.2) 40%, rgba(6,11,21,0.85) 85%)",
  },
  {
    id: 4,
    title: "Мониторинг и алертинг",
    description:
      "Собирайте метрики latency/batch/rate, стройте дашборды в Grafana, и получайте уведомления о деградации качества моделей или таймаутах обучения.",
    badge: "Мониторинг",
    gradient:
      "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.35), rgba(20,184,166,0.2) 45%, rgba(6,11,21,0.75) 75%)",
  },
  {
    id: 5,
    title: "Безопасность и контроль доступа",
    description:
      "JWT/HttpOnly куки, RBAC и Redis-сессии защищают данные, а интеграция с Prometheus и Redis позволяет держать SLA без перегрузок.",
    badge: "Security",
    gradient:
      "radial-gradient(circle at 70% 20%, rgba(236,72,153,0.35), rgba(139,92,246,0.2) 45%, rgba(6,11,21,0.75) 75%)",
  },
];
