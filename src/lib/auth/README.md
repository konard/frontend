# Auth Module - Система авторизации по SOLID принципам

Полнофункциональная система авторизации для SvelteKit, построенная с использованием принципов SOLID.

## Архитектура

### SOLID Принципы

#### 1. Single Responsibility Principle (SRP)
Каждый класс/модуль отвечает за одну задачу:
- **TokenStorage** - управление токенами
- **AuthService** - бизнес-логика авторизации
- **PermissionService** - проверка прав доступа
- **authStore** - управление состоянием

#### 2. Open/Closed Principle (OCP)
Система открыта для расширения через паттерн Strategy:
- **IAuthStrategy** - базовый интерфейс
- **EmailPasswordStrategy** - авторизация через email/password
- **GoogleAuthStrategy** - авторизация через Google
- **TelegramAuthStrategy** - авторизация через Telegram

#### 3. Liskov Substitution Principle (LSP)
Все стратегии взаимозаменяемы и реализуют единый интерфейс.

#### 4. Interface Segregation Principle (ISP)
Разделенные интерфейсы для разных аспектов:
- **ITokenStorage** - хранение токенов
- **IAuthProvider** - операции авторизации
- **IPermissionChecker** - проверка прав
- **IPasswordManager** - управление паролями
- **IEmailVerification** - верификация email

#### 5. Dependency Inversion Principle (DIP)
Все зависимости от абстракций через **AuthContext** (DI Container).

## Структура проекта

Файлы организованы по паттерну `class/<роль>/<имя>/index.ts` (классы, DI-объекты) и
`function/<роль>/<имя>/index.svelte.ts` (реактивные функции/сторы на рунах Svelte 5).
Тест лежит рядом как `index.spec.ts`.

```
src/lib/auth/
├── index.ts                              # Публичный API (barrel)
├── class/
│   ├── context/auth/index.ts             # AuthContext - DI Container
│   ├── adapter/graphql/index.ts          # GraphQLAdapter
│   ├── storage/token/index.ts            # TokenStorage
│   ├── service/
│   │   ├── auth/index.ts                 # AuthService
│   │   └── permission/index.ts           # PermissionService
│   └── strategy/
│       ├── email-password/index.ts       # EmailPasswordStrategy
│       ├── google-auth/index.ts          # GoogleAuthStrategy
│       └── telegram-auth/index.ts        # TelegramAuthStrategy
└── function/
    ├── store/auth/index.svelte.ts        # authStore (Svelte 5 Runes)
    └── state/
        ├── auth/index.svelte.ts          # useAuth()
        └── permissions/index.svelte.ts   # usePermissions()
```

UI-компоненты авторизации (формы логина/регистрации, guard) не входят в этот модуль —
они реэкспортируются из `$stylist/auth` (`export * from '$stylist/auth'` в `index.ts`) и
физически лежат в `stylist-svelte/src/lib/auth/component/**` (см. `AuthGuard`, `LoginPage`,
`RegisterPage`, `ForgotPasswordPage` и т.д.).

## Быстрый старт

### 1. Базовое использование

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  async function handleLogin() {
    const result = await auth.login({
      username: 'user@example.com',
      password: 'password123'
    });

    if (result.success) {
      // Успешная авторизация
    }
  }
</script>

<button onclick={handleLogin}>Login</button>
```

### 2. Использование готовых компонентов

Готовые страницы/формы приходят из `$stylist/auth` (реэкспортированы через `$lib/auth`):

```svelte
<script lang="ts">
  import { LoginPage } from '$lib/auth';
</script>

<LoginPage />
```

### 3. Защита маршрутов

```svelte
<script lang="ts">
  import { AuthGuard } from '$lib/auth';
</script>

<AuthGuard>
  {#snippet children()}
    <h1>Protected Content</h1>
  {/snippet}
</AuthGuard>
```

### 4. Проверка прав доступа

Отдельных guard-компонентов для прав/ролей нет — проверка выполняется через `usePermissions()`:

```svelte
<script lang="ts">
  import { usePermissions } from '$lib/auth';

  const permissions = usePermissions();
</script>

{#if permissions.hasPermission('articles', 'create')}
  <button>Create Article</button>
{/if}

{#if permissions.hasRole('admin')}
  <button>Admin Panel</button>
{/if}
```

## Примеры использования

### Авторизация через Google

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  async function handleGoogleLogin(idToken: string) {
    const result = await auth.loginWithGoogle({ idToken });
    if (result.success) {
      console.log('Google login successful');
    }
  }
</script>
```

### Авторизация через Telegram

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  async function handleTelegramLogin(telegramData) {
    const result = await auth.loginWithTelegram(telegramData);
    if (result.success) {
      console.log('Telegram login successful');
    }
  }
</script>
```

### Регистрация

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  async function handleRegister() {
    const result = await auth.register({
      username: 'newuser',
      email: 'user@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    });
  }
</script>
```

### Восстановление пароля

```svelte
<script lang="ts">
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  async function requestReset() {
    const result = await auth.requestPasswordReset({
      email: 'user@example.com'
    });
  }

  async function resetPassword(token: string, newPassword: string) {
    const result = await auth.resetPassword({
      token,
      newPassword
    });
  }
</script>
```

### Проверка прав программно

```svelte
<script lang="ts">
  import { usePermissions } from '$lib/auth';

  const permissions = usePermissions();

  const canEdit = permissions.hasPermission('articles', 'edit');
  const isAdmin = permissions.hasRole('admin');
  const canDelete = permissions.canAccess('articles', 'delete', 'all');
</script>

{#if canEdit}
  <button>Edit</button>
{/if}
```

### Использование Store напрямую

```svelte
<script lang="ts">
  import { authStore } from '$lib/auth';

  // Svelte 5 Runes
  const user = $derived(authStore.user);
  const isAuthenticated = $derived(authStore.isAuthenticated);
</script>

{#if isAuthenticated}
  <p>Welcome, {user?.username}!</p>
{/if}
```

## API Reference

### useAuth()

Основной хук для работы с авторизацией.

**State:**
- `user` - текущий пользователь
- `isAuthenticated` - статус авторизации
- `isLoading` - статус загрузки
- `error` - ошибка
- `roles` - роли пользователя

**Methods:**
- `login(credentials)` - вход
- `loginWithGoogle(data)` - вход через Google
- `loginWithTelegram(data)` - вход через Telegram
- `register(data)` - регистрация
- `logout()` - выход
- `refreshToken()` - обновление токена
- `requestPasswordReset(data)` - запрос восстановления пароля
- `resetPassword(data)` - сброс пароля
- `verifyEmail(data)` - верификация email
- `resendVerificationEmail(email)` - повторная отправка письма
- `checkAuth()` - проверка авторизации

### usePermissions()

Хук для работы с правами доступа.

**Methods:**
- `hasPermission(resource, action)` - проверка прав
- `canAccess(resource, action, scope?)` - проверка доступа
- `hasRole(roleName)` - проверка роли
- `hasAnyRole(roleNames)` - проверка любой из ролей
- `hasAllRoles(roleNames)` - проверка всех ролей
- `getRoles()` - получение ролей
- `getPermissions()` - получение прав

## Расширение функциональности

### Добавление новой стратегии авторизации

1. Создайте класс, реализующий `IAuthStrategy`, в `class/strategy/<имя>/index.ts`:

```typescript
// class/strategy/custom/index.ts
import type { AuthResponse, AuthResult, IAuthStrategy, IGraphQLClient } from '$stylist/auth';

export class CustomAuthStrategy implements IAuthStrategy {
  private graphqlClient: IGraphQLClient;

  constructor(graphqlClient: IGraphQLClient) {
    this.graphqlClient = graphqlClient;
  }

  async authenticate(credentials: unknown): Promise<AuthResult<AuthResponse>> {
    // Ваша логика авторизации
  }

  getStrategyName(): string {
    return 'custom';
  }
}
```

2. Добавьте стратегию в `class/service/auth/index.ts`:

```typescript
import { CustomAuthStrategy } from '../../strategy/custom';

export class AuthService {
  private customAuthStrategy: CustomAuthStrategy;

  constructor(tokenStorage: ITokenStorage, graphqlClient: IGraphQLClient) {
    // ...
    this.customAuthStrategy = new CustomAuthStrategy(graphqlClient);
  }

  async loginWithCustom(data: CustomAuthData): Promise<AuthResult<AuthResponse>> {
    const result = await this.customAuthStrategy.authenticate(data);
    if (result.success) {
      await this.tokenStorage.saveTokens(result.data.tokens);
    }
    return result;
  }
}
```

## Тестирование

Все сервисы реализуют интерфейсы, что упрощает создание моков для тестирования:

```typescript
import { AuthService } from '$lib/auth';
import type { ITokenStorage, IGraphQLClient } from '$lib/auth';

// Mock dependencies
const mockTokenStorage: ITokenStorage = {
  saveTokens: vi.fn(),
  getTokens: vi.fn(),
  clearTokens: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn()
};

const mockGraphQLClient: IGraphQLClient = {
  query: vi.fn(),
  mutate: vi.fn()
};

const authService = new AuthService(mockTokenStorage, mockGraphQLClient);
```

## Лицензия

MIT
