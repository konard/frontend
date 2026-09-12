---
title: Frontend Knowledge Map
scope: packages/frontend
updated: 2025-10-31
generator: manual review by Codex GPT-5
tokens_estimate: ~1700
---

## 1. Как читать этот файл
- Блок 2 описывает слои Feature-Sliced Design (`src/`).
- Блок 3 содержит текстовое дерево каталога без служебных символов.
- Блок 4 связывает пути с задачами и документацией.
- Блок 5 — чек-лист обновления и команды проверки.

## 2. FSD слои внутри `src/`
| Слой            | Назначение                                                                 | Ключевые подпапки                                   | Документация |
|----------------|-----------------------------------------------------------------------------|-----------------------------------------------------|--------------|
| `app/`         | точка входа SvelteKit, глобальные стили и клиент Houdini                    | `app.css`, `app.d.ts`, `app.html`, `client.ts`      | [app_ru](./docs/FSD/core/app_ru.md) |
| `entities/`    | бизнес-сущности домена (концепты, словари, языки, пользователи)             | `concept/`, `dictionary/`, `language/`, `user/`     | [entities_ru](./docs/FSD/core/entities_ru.md) |
| `features/`    | пользовательские сценарии из сущностей                                     | `auth/`, `concept-management/`, `languages/` и др.  | [features_ru](./docs/FSD/core/features_ru.md) |
| `lib/`         | инфраструктурные библиотеки, GraphQL клиент, конфигурации, утилиты          | `api/`, `assets/`, `auth/`, `components/`, `utils/` | [lib_ru](./docs/FSD/lib/lib_ru.md) |
| `pages/`       | страницы, собирающие вид из сущностей и фич                                 | `auth/`, `concepts/`, `dictionaries/`, `languages/`, `main/` | [pages_ru](./docs/FSD/pages/pages_ru.md) |
| `processes/`   | координаторы длительных сценариев (папка пока пустая)                       | —                                                   | [processes_ru](./docs/FSD/core/processes_ru.md) |
| `routes/`      | файловые маршруты SvelteKit, хранят эндпоинты и layout                      | `admin/`, `concepts/`, `dashboard/`, `+layout.*`    | [routes_ru](./docs/FSD/core/routes_ru.md) |
| `shared/`      | переиспользуемые модули и UI для всех слоёв                                 | `api/`, `assets/`, `config/`, `lib/`, `types/`, `ui/`, `utils/` | [shared_ru](./docs/FSD/shared/shared_ru.md) |
| `widgets/`     | композиционные элементы UI                                                  | `header/`, `language-switcher/`, `navigation/`, `pivot-visualization/`, `search/`, `sidebar/` | [widgets_ru](./docs/FSD/widgets/widgets_ru.md) |
| `hooks.server.ts` | точка расширения серверной логики SvelteKit                             | —                                                   | [layout_ts](./docs/FSD/core/layout_ts.md) |

## 3. Текстовое дерево `packages/frontend`
```text
frontend/
  .claude/ → конфигурации Claude AI
  .github/ → workflows и шаблоны GitHub
  .houdini/ → артефакты Houdini GraphQL (генерируется)
  .svelte-kit/ → билд-артефакты SvelteKit (генерируется)
  .yarn/ → кэш Yarn 3
  docs/ → проектная документация (ADR, FSD, гайды)
  e2e/ → скрипты Playwright для end-to-end тестов
  node_modules/ → зависимости (игнорируется в контроле)
  scripts/ → вспомогательные CLI-скрипты
  src/ → исходный код приложения (см. блок 2)
  static/ → статические файлы и манифесты
  .dockerignore → правила исключений Docker
  .env.example → образец переменных окружения
  .gitignore → правила исключений Git
  .graphqlrc.yaml → конфигурация клиента GraphQL
  .npmrc → конфигурация npm
  .prettierignore → исключения форматирования Prettier
  .prettierrc → правила форматирования Prettier
  .yarnrc.yml → конфигурация Yarn
  DOCKER.md → гайд по окружениям Docker
  Dockerfile → сборка production образа
  Dockerfile.dev → сборка dev-окружения
  LICENSE → лицензия проекта
  QWEN.md → подсказки для модели Qwen
  README.md → обзор фронтенд-пакета
  SCRIPTS.md → описание скриптов Yarn
  eslint.config.js → правила ESLint
  houdini.config.js → конфигурация Houdini
  index.md → предыдущая версия карты
  package.json → зависимость и скрипты
  playwright.config.ts → конфигурация Playwright
  schema.graphql → схема GraphQL
  svelte.config.js → настройки SvelteKit
  tsconfig.json → корневой tsconfig
  vite.config.ts → конфигурация Vite
  vitest-setup-client.ts → подготовка Vitest
  yarn.lock → зафиксированные версии
```

## 4. Пути, роли и документация
| Путь | Назначение | Док |
|------|------------|-----|
| `docs/` | Каталог документации (ADR, FSD, гайды, SCRUM, YARN) | [docs/README.md](./docs/README.md) |
| `docs/FSD/` | Гайды по слоям Feature-Sliced | [FSD index](./docs/FSD/README.md) |
| `e2e/` | Тесты Playwright | — |
| `scripts/` | Node/Yarn-скрипты автоматизации | [SCRIPTS.md](./docs/YARN/SCRIPTS.md) |
| `static/` | `favicon`, манифесты, статичные ассеты | — |
| `src/app/` | Корневой слой приложения | [app_ru](./docs/FSD/core/app_ru.md) |
| `src/entities/` | Доменные сущности | [entities_ru](./docs/FSD/core/entities_ru.md) |
| `src/features/` | Прикладные сценарии | [features_ru](./docs/FSD/core/features_ru.md) |
| `src/lib/` | Общие библиотеки и инфраструктура | [lib_ru](./docs/FSD/lib/lib_ru.md) |
| `src/pages/` | Страницы и композиция UI | [pages_ru](./docs/FSD/pages/pages_ru.md) |
| `src/processes/` | Сценарии высокого уровня | [processes_ru](./docs/FSD/core/processes_ru.md) |
| `src/routes/` | Файловые маршруты SvelteKit | [routes_ru](./docs/FSD/core/routes_ru.md) |
| `src/shared/` | Общие модули, UI и утилиты | [shared_ru](./docs/FSD/shared/shared_ru.md) |
| `src/widgets/` | Композиционные блоки UI | [widgets_ru](./docs/FSD/widgets/widgets_ru.md) |
| `src/routes/+layout.*` | Базовый layout и загрузчики | [layout_svelte](./docs/FSD/core/layout_svelte.md), [layout_ts](./docs/FSD/core/layout_ts.md), [layout_gql](./docs/FSD/core/layout_gql.md) |
| `src/routes/+page.svelte` | Главная страница | [page_svelte](./docs/FSD/core/page_svelte.md) |
| `src/routes/page.svelte.spec.ts` | Тесты для главной страницы | [page_svelte_spec_ts](./docs/FSD/core/page_svelte_spec_ts.md) |
| `src/widgets/language-switcher/` | Переключение языка | [language_switcher_ru](./docs/FSD/languages/language_switcher_ru.md) |
| `src/lib/graphql-client.ts` | Клиент Houdini GraphQL | [graphql_client_ts](./docs/FSD/lib/graphql_client_ts.md) |
| `src/lib/config.ts` | Конфигурация приложения | [config_shared_ru](./docs/FSD/shared/config_shared_ru.md) |
| `hooks.server.ts` | Серверные хуки SvelteKit | [layout_ts](./docs/FSD/core/layout_ts.md) |
| `Dockerfile` / `Dockerfile.dev` | Прод и dev контейнеры | [DOCKER README](./docs/DOCKER/README.md) |

## 5. Поддержание актуальности
- **Перед коммитом:** `yarn lint`, `yarn test`, `yarn test:e2e --dry-run`.
- **Проверка дерева:** `node scripts/print-tree.mjs` (сравнить вывод с блоком 3).
- **Обновление:** при добавлении/удалении каталога — внести изменения в блоки 3 и 4 и обновить `updated`.
- **Контроль ссылок:** если создаёшь новый документ в `docs/`, сразу добавь запись в таблицу.
- **Размер:** следи, чтобы документ оставался ≤1800 слов; при расширении переносить детали в профильные документы.
