# Карта сайта (Site Map)

Этот документ представляет собой карту файлов и папок frontend проекта. 
Используйте карту сайта для понимания архитектуры проекта и принципов Feature-Sliced Design'а.
Внимательное изучение помогает понять структуру файловой системы и предназначение каждого файла. 
Рекомендуем для навигации по проекту опираться на иерархическую структуру карты сайта.

---

# Типы данных в строках карты (Data Types)

Карта сайта содержит две колонки, которые делят контент пополам в полном соответствии друг другу.

1. **Путь и файлы проекта Frontend** - содержит древовидную структуру с именами файлов и директорий
2. **Описание главной полезной функции и ссылка на файл с документацией** - поясняет назначение файла или директории. В скобках может содержать путь к документу.

Можно кликнуть по ссылке на документацию и перейти к соответствующему файлу с подробным описанием.

---

### Пример чтения строки:

├── features/                                                   # [Функциональные возможности приложения](./docs/FSD/core/features_ru.md)

- `├── features/` - директория на уровне src/
- `# [Функциональные возможности приложения]` - краткое описание
- `(./docs/folder_features_ru.md)` - ссылка на подробную документацию

---

## Путь и файлы проекта Frontend                                # Описание функций файла с исходным кодом приложения                                  
/
├── .claude/                                                    # Конфигурации Claude AI
├── .github/                                                    # GitHub конфигурации и шаблоны
├── .yarn/                                                      # Yarn зависимости и кэш
├── .dockerignore                                               # Правила игнорирования файлов для Docker
├── .env.example                                                # Пример файла переменных окружения
├── .gitignore                                                  # Правила игнорирования файлов для Git
├── .graphqlrc.yaml                                             # Конфигурация GraphQL
├── .npmrc                                                      # Конфигурация npm
├── .prettierignore                                             # Правила игнорирования файлов для Prettier
├── .prettierrc                                                 # Конфигурация Prettier
├── .yarnrc.yml                                                 # Конфигурация Yarn
├── docker-compose.yml                                          # Конфигурация Docker Compose
├── Dockerfile                                                  # Docker конфигурация для production
├── Dockerfile.dev                                              # Docker конфигурация для разработки
├── eslint.config.js                                            # Конфигурация ESLint
├── houdini.config.js                                           # Конфигурация Houdini GraphQL
├── LICENSE                                                     # Лицензия проекта
├── index.md                                                    # Карта сайта (этот файл)
├── package.json                                                # Зависимости и скрипты проекта
├── playwright.config.ts                                        # Конфигурация Playwright тестов
├── QWEN.md                                                     # Заметки для Qwen AI
├── README.md                                                   # Основное описание проекта
├── schema.graphql                                              # GraphQL схема
├── DOCKER.md                                                   # [Документация по Docker](./docs/DOCKER/README.md)
├── SCRIPTS.md                                                  # [Документация по скриптам](./docs/YARN/SCRIPTS.md)
├── svelte.config.js                                            # Конфигурация SvelteKit
├── tsconfig.json                                               # Конфигурация TypeScript
├── vite.config.ts                                              # Конфигурация Vite
├── vitest-setup-client.ts                                      # Настройки клиентских тестов Vitest
├── yarn.lock                                                   # Заблокированные версии зависимостей Yarn
├── docs/                                                       # [Документация по проекту](./docs/README.md)
├── e2e/                                                        # Интеграционные тесты
├── scripts/                                                    # [Скрипты для автоматизации задач](./docs/FSD/core/scripts_ru.md)
├── static/                                                     # Статические файлы
└── src/                                                        # Исходный код приложения

---

## Feature-Sliced Design структура директории src               # Описание функций файла с исходным кодом приложения  
src/
├── app/                                                        # [Конфигурация приложения и основные настройки SvelteKit](./docs/FSD/core/app_ru.md)
│   ├── app.css                                                 # Основные стили для всего приложения
│   ├── app.d.ts                                                # Типизированные определения для SvelteKit
│   ├── app.html                                                # HTML шаблон, для вставки приложения SvelteKit
│   └── client.ts                                               # Клиентские настройки для Houdini GraphQL
├── entities/                                                   # [Бизнес-сущности приложения](./docs/FSD/core/entities_ru.md)
│   ├── concept/                                                # [Компоненты, относящиеся к концепциям](./docs/FSD/concepts/concept_ru.md)
│   ├── dictionary/                                             # [Компоненты, относящиеся к словарям](./docs/FSD/dictionaries/dictionary_ru.md)
│   ├── language/                                               # [Компоненты, относящиеся к языкам](./docs/FSD/languages/language_ru.md)
│   └── user/                                                   # [Компоненты, относящиеся к пользователям](./docs/FSD/core/user_ru.md)
├── features/                                                   # [Функциональные возможности приложения](./docs/FSD/core/features_ru.md)
│   ├── auth/                                                   # [Компоненты аутентификации и авторизации](./docs/FSD/auth/auth_ru.md)
│   ├── concept-management/                                     # [Управление концепциями](./docs/FSD/concepts/concept_management_ru.md)
│   ├── concepts/                                               # [Функции, связанные с концепциями](./docs/FSD/concepts/concepts_ru.md)
│   ├── dictionaries/                                           # [Функции, связанные со словарями](./docs/FSD/dictionaries/dictionaries_ru.md)
│   ├── dictionary-management/                                  # [Управление словарями](./docs/FSD/dictionaries/dictionary_management_ru.md)
│   ├── language-management/                                    # [Управление языками](./docs/FSD/languages/language_management_ru.md)
│   └── languages/                                              # [Функции, связанные с языками](./docs/FSD/languages/languages_ru.md)
├── lib/                                                        # [Общие библиотеки и вспомогательные функции](./docs/FSD/lib/lib_ru.md)
│   ├── api/                                                    # [API клиенты и типы](./docs/FSD/lib/api_ru.md)
│   ├── assets/                                                 # [Ресурсы приложения](./docs/FSD/lib/assets_ru.md)
│   ├── auth/                                                   # [Библиотека аутентификации](./docs/FSD/auth/auth_lib_ru.md)
│   ├── components/                                             # [Общие компоненты UI](./docs/FSD/core/components_ru.md)
│   │   ├── ontology/                                           # [Компоненты для отображения онтологии](./docs/FSD/core/ontology_ru.md)
│   │   ├── visualization/                                      # [Компоненты для визуализации](./docs/FSD/visualizations/visualization_ru.md)
│   │   └── visualizations/                                     # [Различные визуализации](./docs/FSD/visualizations/visualizations_ru.md)
│   ├── config.ts                                               # [Конфигурация приложения](./docs/FSD/shared/config_shared_ru.md)
│   ├── config.spec.ts                                          # [Тесты для конфигурации](./docs/FSD/shared/config_shared_ru.md)
│   ├── errors/                                                 # [Система обработки ошибок](./docs/FSD/lib/errors_ru.md)
│   ├── graphql-client.ts                                       # [GraphQL клиент для Houdini](./docs/FSD/lib/graphql_client_ts.md)
│   ├── index.ts                                                # [Главный экспорт библиотеки](./docs/FSD/lib/index_ts.md)
│   ├── notifications/                                          # [Система уведомлений](./docs/FSD/lib/notifications_ru.md)
│   ├── schemas/                                                # [Схемы данных](./docs/FSD/lib/schemas_ru.md)
│   ├── stores/                                                 # [Svelte stores](./docs/FSD/lib/stores_ru.md)
│   └── utils/                                                  # [Вспомогательные утилиты](./docs/FSD/lib/utils_ru.md)
├── pages/                                                      # [Страницы приложения](./docs/FSD/pages/pages_ru.md)
│   ├── auth/                                                   # [Страницы аутентификации](./docs/FSD/auth/auth_pages_ru.md)
│   ├── concepts/                                               # [Страницы концепций](./docs/FSD/concepts/concepts_pages_ru.md)
│   ├── dictionaries/                                           # [Страницы словарей](./docs/FSD/dictionaries/dictionaries_pages_ru.md)
│   ├── languages/                                              # [Страницы языков](./docs/FSD/languages/languages_pages_ru.md)
│   └── main/                                                   # [Главные страницы](./docs/FSD/pages/main_pages_ru.md)
├── processes/                                                  # [Процессы приложения (в настоящее время пуста)](./docs/FSD/core/processes_ru.md)
├── routes/                                                     # [Роуты приложения для SvelteKit](./docs/FSD/core/routes_ru.md)
│   ├── admin/                                                  # [Административные маршруты](./docs/FSD/routes/admin_routes_ru.md)
│   ├── concepts/                                               # [Маршруты концепций](./docs/FSD/routes/concepts_routes_ru.md)
│   ├── dashboard/                                              # [Маршрут панели управления](./docs/FSD/routes/dashboard_routes_ru.md)
│   ├── dictionaries/                                           # [Маршруты словарей](./docs/FSD/routes/dictionaries_routes_ru.md)
│   ├── forgot-password/                                        # [Восстановление пароля](./docs/FSD/routes/forgot_password_routes_ru.md)
│   ├── languages/                                              # [Маршруты языков](./docs/FSD/routes/languages_routes_ru.md)
│   ├── login/                                                  # [Вход в систему](./docs/FSD/routes/login_routes_ru.md)
│   ├── register/                                               # [Регистрация](./docs/FSD/routes/register_routes_ru.md)
│   ├── visualization/                                          # [Маршрут визуализации](./docs/FSD/routes/visualization_routes_ru.md)
│   └── visualizations/                                         # [Маршруты визуализаций](./docs/FSD/routes/visualizations_routes_ru.md)
│   ├── +layout.gql                                             # [GraphQL запросы для макета](./docs/FSD/core/layout_gql.md)
│   ├── +layout.svelte                                          # [Основной компонент макета](./docs/FSD/core/layout_svelte.md)
│   ├── +layout.ts                                              # [Логика для макета](./docs/FSD/core/layout_ts.md)
│   ├── +page.svelte                                            # [Главная страница](./docs/FSD/core/page_svelte.md)
│   └── page.svelte.spec.ts                                     # [Тесты для главной страницы](./docs/FSD/core/page_svelte_spec_ts.md)
├── shared/                                                     # [Общие компоненты и утилиты для всего приложения](./docs/FSD/shared/shared_ru.md)
│   ├── api/                                                    # [Общие API клиенты](./docs/FSD/shared/api_shared_ru.md)
│   ├── assets/                                                 # [Общие ресурсы](./docs/FSD/shared/assets_shared_ru.md)
│   ├── config/                                                 # [Общие настройки](./docs/FSD/shared/config_shared_ru.md)
│   ├── lib/                                                    # [Общие библиотеки](./docs/FSD/shared/lib_shared_ru.md)
│   ├── types/                                                  # [Общие типы TypeScript](./docs/FSD/shared/types_shared_ru.md)
│   ├── ui/                                                     # [Общие UI компоненты](./docs/FSD/shared/ui_shared_ru.md)
│   └── utils/                                                  # [Общие утилиты](./docs/FSD/shared/utils_shared_ru.md)
├── widgets/                                                    # [Композитные компоненты интерфейса](./docs/FSD/widgets/widgets_ru.md)
│   ├── header/                                                 # [Компонент шапки](./docs/FSD/widgets/header_ru.md)
│   ├── language-switcher/                                      # [Переключатель языков](./docs/FSD/languages/language_switcher_ru.md)
│   ├── navigation/                                             # [Компонент навигации](./docs/FSD/widgets/navigation_ru.md)
│   ├── pivot-visualization/                                    # [Визуализация pivot-таблицы](./docs/FSD/widgets/pivot-visualization.md)
│   ├── search/                                                 # [Компонент поиска](./docs/FSD/widgets/search_ru.md)
│   └── sidebar/                                                # [Компонент боковой панели](./docs/FSD/widgets/sidebar_ru.md)
└── hooks.server.ts                                             # Серверные хуки SvelteKit для обработки запросов и сессий

---

## Инструкции поддержания карты сайта в актуальном состоянии

Для поддержания карты в актуальном состоянии рекомендуется:

1. При добавлении новой папки или файла обновлять этот документ
2. При изменении функционала обновлять описания файлов
3. Периодически сверять структуру с актуальным состоянием проекта
4. Создавать соответствующие файлы описания для новых папок
5. Символы ├ ├── └ │ указывают на иерархию файлов и директорий
6. Используйте поисковые функции для быстрого нахождения конкретных файлов