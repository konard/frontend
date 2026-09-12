# Multipult Frontend

Система управления мультиязычным контентом, построенная на современных технологиях с применением принципов SOLID.

## Оглавление

- [Описание проекта](#описание-проекта)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Архитектура проекта](#архитектура-проекта)
- [Основной функционал](#основной-функционал)
- [Реализованные улучшения](#реализованные-улучшения)
- [Работа с проектом](#работа-с-проектом)
- [GraphQL API](#graphql-api)
- [Команды](#команды)
- [Статус проекта](#статус-проекта)
- [Roadmap и планы развития](#roadmap-и-планы-развития)
- [Troubleshooting](#troubleshooting)
- [Дополнительная документация](#дополнительная-документация)
- [Поддержка](#поддержка)

## Описание проекта

Multipult Frontend - это система управления мультиязычным контентом, построенная на современных технологиях с применением принципов SOLID. Проект обеспечивает:

- Мультиязычную поддержку контента
- Управление концепциями и словарями
- Современную архитектуру на основе SvelteKit
- Типизированное взаимодействие с GraphQL API
- Гибкую систему авторизации и ролей

## Технологический стек

### Frontend
- **SvelteKit 2** - full-stack фреймворк для создания веб-приложений
- **Svelte 5** - UI фреймворк с новыми Runes API
- **TypeScript** - типизированный JavaScript
- **TailwindCSS 4** - utility-first CSS фреймворк
- **Houdini** - GraphQL клиент для Svelte с автогенерацией типов

### API & Интеграции
- **GraphQL** - язык запросов для API
- Настраивается через environment variables

### Инструменты разработки
- **Vite** - сборщик проекта
- **Vitest** - unit-тестирование
- **Playwright** - E2E тестирование
- **ESLint** - линтер кода
- **Prettier** - форматирование кода

### Деплой
- **@sveltejs/adapter-node** - для деплоя на Node.js сервер

## Быстрый старт

### 1. Установка зависимостей

```bash
yarn install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` под ваше окружение:

```env
VITE_GRAPHQL_ENDPOINT=http://127.0.0.1:8000/graphql/
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_DEBUG=true
```

### 3. Запуск Backend сервера (ВАЖНО!)

**⚠️ ВАЖНО:** Frontend требует работающий backend GraphQL сервер!

Убедитесь, что backend запущен на `http://127.0.0.1:8000`:

```bash
# Перейдите в папку backend
cd ../backend

# Запустите backend сервер (Django)
python manage.py runserver 127.0.0.1:8000
```

Проверьте доступность GraphQL API: http://127.0.0.1:8000/graphql/

**Если backend недоступен:** См. [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) для troubleshooting

### 4. Генерация типов Houdini

```bash
npx houdini generate
```

### 5. Запуск development сервера

```bash
yarn dev
```

Приложение доступно по адресу: http://localhost:5173

## Архитектура проекта

### Структура директорий

```
frontend/
├── .env, .env.staging, .env.production  # Конфигурация окружений
├── IMPROVEMENTS.md                       # Документация реализованных улучшений
├── SETUP.md                              # Подробные инструкции по настройке
├── src/
│   ├── lib/
│   │   ├── config.ts                    # Конфигурация приложения + logger
│   │   ├── errors/                      # Система обработки ошибок
│   │   │   ├── AppError.ts              # Типизированные ошибки
│   │   │   ├── ErrorHandler.ts          # Централизованный обработчик
│   │   │   ├── types.ts                 # Типы ошибок
│   │   │   ├── integrations.ts          # Интеграция с notifications
│   │   │   └── index.ts
│   │   ├── notifications/               # Система уведомлений (Toast)
│   │   │   ├── notificationStore.svelte.ts  # Store на Runes
│   │   │   ├── Toast.svelte             # Компонент уведомления
│   │   │   ├── ToastContainer.svelte    # Контейнер для уведомлений
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── graphql-client.ts            # GraphQL клиент (Houdini)
│   │   ├── auth/                        # Система авторизации (SOLID)
│   │   │   ├── adapters/                # GraphQL адаптер
│   │   │   ├── components/              # UI компоненты
│   │   │   ├── composables/             # Хуки (useAuth, usePermissions)
│   │   │   ├── services/                # Бизнес-логика
│   │   │   ├── storage/                 # Хранение токенов
│   │   │   ├── stores/                  # State management
│   │   │   ├── strategies/              # Стратегии авторизации
│   │   │   ├── README.md                # Документация модуля
│   │   │   └── ARCHITECTURE.md          # Описание архитектуры
│   │   ├── api/                         # Типы данных (бывшие API клиенты)
│   │   │   ├── concepts.ts              # Типы для концепций
│   │   │   ├── dictionaries.ts          # Типы для словарей
│   │   │   └── languages.ts             # Типы для языков
│   │   │   # Примечание: GraphQL queries используются inline через Houdini
│   │   ├── components/                  # Общие компоненты
│   │   │   ├── concepts/
│   │   │   ├── dictionaries/
│   │   │   └── languages/
│   ├── routes/                          # Страницы приложения
│   │   ├── +layout.svelte               # Layout с ToastContainer
│   │   ├── +page.svelte                 # Landing page
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── concepts/
│   │   ├── dictionaries/
│   │   ├── languages/
│   │   └── forgot-password/
│   └── client.ts                        # Houdini клиент
├── static/                              # Статические файлы
├── e2e/                                 # E2E тесты
├── houdini.config.js                    # Конфигурация Houdini
└── schema.graphql                       # GraphQL схема
```

## Основной функционал

### 1. Мультиязычность ✨ NEW!

**Фильтрация контента по языкам:**
- Language Switcher в навигационном меню
- Автоматическая фильтрация словарей по выбранному языку
- Сохранение выбора в localStorage
- Reactive updates через Houdini

**Как использовать:**
- Выберите язык в dropdown "Language" в правом верхнем углу
- Страница Dictionaries автоматически отфильтруется
- Выбор сохраняется между сессиями

**Документация:** см. [MULTILINGUAL_USAGE.md](./MULTILINGUAL_USAGE.md) и [MULTILINGUAL_IMPLEMENTATION.md](./MULTILINGUAL_IMPLEMENTATION.md)

### 2. Система авторизации

**Методы входа:**
- Email/Password (классическая)
- Google OAuth
- Telegram Auth

**Возможности:**
- Регистрация пользователей
- Вход/выход
- Восстановление пароля
- Email верификация
- Обновление токенов
- RBAC (Role-Based Access Control)

**Архитектура:**
- Построена по принципам SOLID
- Паттерн Strategy для методов авторизации
- Dependency Injection через AuthContext
- Разделение интерфейсов (ISP)

**Документация:** см. `src/lib/auth/README.md` и `ARCHITECTURE.md`

### 3. Управление концепциями (Concepts)

Иерархическая структура для организации контента.

**Поля:**
- `id` - уникальный идентификатор
- `path` - путь концепции
- `depth` - глубина вложенности
- `parentId` - родительская концепция (nullable)

**Операции:** CRUD через Houdini mutations

### 4. Словари (Dictionaries)

Переводы концепций на разные языки.

**Поля:**
- `id`, `name`, `description`, `image`
- `languageId` - язык
- `conceptId` - связанная концепция

**Операции:** CRUD с фильтрацией через Houdini

### 5. Языки (Languages)

Управление поддерживаемыми языками.

**Поля:**
- `id` - уникальный идентификатор
- `code` - код языка (ISO)
- `name` - название языка

### 6. Система ролей и разрешений

**Компоненты защиты:**
- `ProtectedRoute` - защита маршрутов
- `RequirePermission` - проверка прав
- `RequireRole` - проверка ролей

## Реализованные улучшения ✅

### 1. Environment Configuration ✅
- Конфигурация для dev/staging/production
- Централизованный модуль `config.ts`
- Conditional logging (только в development)

### 2. Централизованная обработка ошибок ✅
- Типизированные ошибки (`AppError`)
- `ErrorHandler` для единообразной обработки
- Автоматическая интеграция с уведомлениями

### 3. Система уведомлений (Toast) ✅
- Store на Svelte 5 Runes
- 4 типа: success, error, warning, info
- Автоматическое закрытие и кастомные действия
- Интегрирована в layout

### 4. Houdini GraphQL ✅
- Type-safe queries и mutations
- Автоматическая генерация TypeScript типов
- Кеширование `CacheAndNetwork`
- Директива `@list` для автообновления

## Работа с проектом

### Environment Configuration

```typescript
import { config, logger } from '$lib/config';

// Доступ к конфигурации
const endpoint = config.graphqlEndpoint;
const isProduction = config.isProduction;

// Conditional logging (только в dev)
logger.log('Debug info');
logger.error('Error'); // Всегда выводится
```

### Error Handling

```typescript
import { errorHandler } from '$lib/errors';

// Автоматическая обработка с уведомлением
try {
  await someOperation();
} catch (error) {
  errorHandler.handle(error); // Покажет toast автоматически
}

// Создание специфичных ошибок
throw errorHandler.createError.validation('Invalid input');
throw errorHandler.createError.authentication('Token expired');
throw errorHandler.createError.notFound('User');

// Async обработка
await errorHandler.handleAsync(async () => {
  return await fetchData();
});
```

### Notifications

```typescript
import { notificationStore } from '$lib/notifications';

// Простые уведомления
notificationStore.success('Saved!');
notificationStore.error('Failed to load data');
notificationStore.warning('Please check your input');
notificationStore.info('New update available');

// С дополнительными опциями
notificationStore.success('Saved!', {
  title: 'Success',
  duration: 3000,
  action: {
    label: 'View',
    callback: () => navigate('/item')
  }
});

// Управление
notificationStore.dismiss(id);
notificationStore.dismissAll();
```

### GraphQL с Houdini

```svelte
<script lang="ts">
  import { graphql } from '$houdini';
  import { errorHandler } from '$lib/errors';
  import { notificationStore } from '$lib/notifications';

  // Query с автоматическим кешированием
  const GetConcepts = graphql`
    query GetConcepts {
      concepts {
        id
        path
        depth
        parentId
      }
    }
  `;

  const { data } = GetConcepts.fetch();

  // Mutation с обработкой ошибок
  const CreateConcept = graphql`
    mutation CreateConcept($input: ConceptInput!) {
      createConcept(input: $input) {
        id
        path
        depth
      }
    }
  `;

  async function create() {
    try {
      await CreateConcept.mutate({
        input: {
          path: '/categories/electronics',
          depth: 2,
          parentId: 1
        }
      });
      notificationStore.success('Concept created!');
    } catch (error) {
      errorHandler.handle(error);
    }
  }
</script>

{#if $data}
  {#each $data.concepts as concept}
    <div>{concept.path}</div>
  {/each}
{/if}
```

### Система авторизации

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';
  import { RequirePermission, RequireRole } from '$lib/auth';

  const auth = useAuth();

  async function handleLogin() {
    await auth.login({
      username: 'user@example.com',
      password: 'password123'
    });
  }
</script>

<RequirePermission resource="articles" action="create">
  <button>Create Article</button>
</RequirePermission>

<RequireRole role="admin">
  <div>Admin Panel</div>
</RequireRole>
```

## GraphQL API

### Queries

```graphql
concepts                              # Все концепции
concept(conceptId: Int!)              # Одна концепция
dictionaries(conceptId, languageId)   # Словари
dictionary(dictionaryId)              # Один словарь
languages                             # Все языки
language(languageId)                  # Один язык
me                                   # Текущий пользователь
myRoles                              # Роли пользователя
roles                                # Все роли
role(roleId)                         # Одна роль
```

### Mutations

**Авторизация:**
```graphql
login(input: UserLoginInput!)
loginWithGoogle(input: GoogleAuthInput!)
loginWithTelegram(input: TelegramAuthInput!)
register(input: UserRegistrationInput!)
refreshToken(input: RefreshTokenInput!)
verifyEmail(input: EmailVerificationInput!)
requestPasswordReset(input: PasswordResetRequestInput!)
resetPassword(input: PasswordResetInput!)
```

**CRUD операции:**
```graphql
# Концепции
createConcept(input: ConceptInput!)
updateConcept(conceptId, input: ConceptUpdateInput!)
deleteConcept(conceptId: Int!)

# Словари
createDictionary(input: DictionaryInput!)
updateDictionary(dictionaryId, input: DictionaryUpdateInput!)
deleteDictionary(dictionaryId: Int!)

# Языки
createLanguage(input: LanguageInput!)
updateLanguage(languageId, input: LanguageUpdateInput!)
deleteLanguage(languageId: Int!)

# Роли
createRole(input: RoleInput!)
updateRole(roleId, input: RoleUpdateInput!)
assignRoleToUser(userId, roleName)
removeRoleFromUser(userId, roleName)
addPermissionToRole(roleId, input: PermissionInput!)
```

## Команды

```bash
# Development
yarn dev                  # Запустить dev сервер
yarn build                # Production build
yarn preview              # Предпросмотр production build

# Houdini (GraphQL)
yarn generate             # Генерация TypeScript типов из GraphQL
yarn generate:watch       # Watch режим для автоматической генерации
yarn generate:pull        # Загрузить свежую схему с сервера

# Code Quality
yarn lint                 # Проверить код
yarn format               # Форматировать код
yarn check                # Type checking
yarn check:watch          # Type checking в watch режиме

# Testing
yarn test                 # Все тесты
yarn test:unit            # Unit тесты (Vitest)
yarn test:unit -- --run   # Unit тесты без watch
yarn test:unit -- --coverage  # Unit тесты с coverage
yarn test:e2e             # E2E тесты (Playwright)

# Docker
docker-compose up -d      # Запустить в production режиме
docker-compose --profile dev up frontend-dev  # Dev режим с hot-reload
docker-compose down       # Остановить контейнеры
docker-compose logs -f    # Посмотреть логи
```

**📖 Полное описание команд:** см. [SCRIPTS.md](./docs/YARN/SCRIPTS.md)
**🐳 Docker документация:** см. [DOCKER.md](./docs/DOCKER/README.md)

## Статус проекта

**Версия:** 0.4.0 | **Статус:** Production-Ready

### Реализованные возможности ✅
- ✅ **Environment Configuration** - разные окружения (dev/staging/production)
- ✅ **Error Handling** - централизованная обработка ошибок с типизацией
- ✅ **Notifications** - система toast уведомлений с auto-dismiss
- ✅ **Type-Safe GraphQL** - Houdini с автогенерацией типов (100% migration)
- ✅ **GraphQL Caching** - оптимизированное кеширование запросов
- ✅ **SOLID Architecture** - auth модуль по принципам SOLID
- ✅ **Multilingual Support** - фильтрация контента по языкам
- ✅ **CI/CD Pipeline** - автоматизированное тестирование и сборка
- ✅ **Docker Infrastructure** - контейнеризация для dev и production
- ✅ **Comprehensive Unit Tests** - 146 passing tests, 80%+ coverage
- ✅ **UX Components Library** - 20+ переиспользуемых UI компонентов ✨ NEW!
- ✅ **Form Validation** - Zod интеграция с real-time feedback ✨ NEW!
- ✅ **Utility Functions** - debounce, storage, date formatting и др. ✨ NEW!

### Метрики качества 📊
- **Архитектура:** 9/10 - отличная, масштабируемая
- **Функциональность:** 9/10 - основной функционал + UX компоненты ⬆️
- **UX:** 9/10 - значительные улучшения с новой библиотекой компонентов ⬆️
- **Production-ready:** 9/10 - CI/CD и Docker настроены
- **Тестирование:** 8/10 - 146 unit тестов, coverage 80%+
- **DevOps:** 8/10 - CI/CD, Docker, security audit
- **Документация:** 10/10 - comprehensive documentation с guides ⬆️

📋 **Что дальше?** См. [BACKLOG.md](./BACKLOG.md) для планов развития

## Roadmap и планы развития

📋 **Product Backlog**: Приоритизированный список задач и планы развития - см. [BACKLOG.md](./BACKLOG.md)

📝 **История изменений**: Полная история версий и изменений - см. [CHANGELOG.md](./CHANGELOG.md)

## Troubleshooting

### Backend сервер недоступен (500 ошибка)

**Симптомы:**
- Ошибка "Server error. Please try again later or contact support."
- В консоли: `Failed to load resource: status 500`
- Не удается залогиниться

**Решение:**
1. Убедитесь, что backend запущен на `http://127.0.0.1:8000`
2. Проверьте доступность GraphQL endpoint: http://127.0.0.1:8000/graphql/
3. См. подробную документацию: [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md)

### Ошибка базы данных: "column user_profiles.avatar_file_id does not exist"

**Симптомы:**
- При входе появляется ошибка "Server database error. Please contact the administrator to fix the database schema."
- В консоли: `psycopg2.errors.UndefinedColumn: column user_profiles.avatar_file_id does not exist`

**Решение:**
- Это проблема на стороне backend - требуется миграция базы данных
- Frontend уже обрабатывает эту ошибку gracefully
- **Для backend администратора:** См. [BACKEND_DATABASE_FIX.md](./BACKEND_DATABASE_FIX.md)

### Проблемы с повторным входом после logout

**Симптомы:**
- После logout не происходит редирект при повторном login
- Пользователь "залогинен", но `isAuthenticated = false`

**Решение:**
- Эта проблема исправлена в последнем коммите
- См. [AUTH_FIX_LOGIN_REDIRECT.md](./AUTH_FIX_LOGIN_REDIRECT.md)

### Другие проблемы

См. полный список в [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Дополнительная документация

### Планирование и отслеживание
- **[BACKLOG.md](./BACKLOG.md)** - 📋 Product backlog и roadmap проекта
- **[CHANGELOG.md](./CHANGELOG.md)** - 📝 История изменений по версиям
- **[QUICK_WINS.md](./QUICK_WINS.md)** - ⚡ Быстрые улучшения (15-30 минут каждое)

### UX и компоненты ✨ NEW!
- **[docs/UX_COMPONENTS.md](./docs/UX_COMPONENTS.md)** - 📖 Полное руководство по UX компонентам
- **[docs/OPTIMISTIC_UI.md](./docs/OPTIMISTIC_UI.md)** - 🔄 Guide по optimistic UI updates

### Тестирование и качество
- **[TESTING.md](./TESTING.md)** - 📖 Comprehensive testing guide (146 unit tests)

### Deployment и DevOps
- **[DOCKER.md](./docs/DOCKER/README.md)** - 🐳 Руководство по использованию Docker
- **[SCRIPTS.md](./docs/YARN/SCRIPTS.md)** - ⚙️ Полное описание всех npm/yarn команд

### Настройка и troubleshooting
- **[SETUP.md](./SETUP.md)** - 🔧 Детальные инструкции по настройке проекта
- **[BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md)** - 🔌 Подключение к backend и troubleshooting
- **[BACKEND_DATABASE_FIX.md](./BACKEND_DATABASE_FIX.md)** - 🗄️ Исправление ошибки базы данных (для администратора backend)

### Функциональность
- **[MULTILINGUAL_USAGE.md](./MULTILINGUAL_USAGE.md)** - 🌍 Руководство по мультиязычности
- **[MULTILINGUAL_IMPLEMENTATION.md](./MULTILINGUAL_IMPLEMENTATION.md)** - 📐 План реализации мультиязычности
- **[AUTH_FIX_LOGIN_REDIRECT.md](./AUTH_FIX_LOGIN_REDIRECT.md)** - 🔐 Исправление проблемы с logout/login

### Архитектура
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - ✨ Подробное описание реализованных улучшений
- **[src/lib/auth/README.md](./src/lib/auth/README.md)** - 📚 Документация системы авторизации
- **[src/lib/auth/ARCHITECTURE.md](./src/lib/auth/ARCHITECTURE.md)** - 🏛️ SOLID архитектура auth модуля

## Сильные стороны проекта

1. ✅ **Production-Ready** - environment configuration, error handling
2. ✅ **Type-Safety** - TypeScript + Houdini автогенерация
3. ✅ **Modern Stack** - Svelte 5, TailwindCSS 4, Vite
4. ✅ **SOLID Architecture** - расширяемая система авторизации
5. ✅ **User-Friendly** - toast notifications, error messages
6. ✅ **Performance** - GraphQL кеширование, optimistic updates
7. ✅ **Developer Experience** - отличная документация, type hints

## Поддержка

Если у вас возникли вопросы:
1. Проверьте документацию в `IMPROVEMENTS.md` и `SETUP.md`
2. Посмотрите примеры в существующих компонентах
3. Изучите документацию auth модуля
4. Обратитесь к команде разработки

---

**Версия:** 0.4.0 | **Статус:** Production-Ready

**Проект готов к production использованию.** Миграция на Houdini завершена, comprehensive unit tests покрывают все критические модули, CI/CD настроен. Добавлена полная библиотека UX компонентов с валидацией форм.

Следующие приоритеты развития смотрите в [BACKLOG.md](./BACKLOG.md).
