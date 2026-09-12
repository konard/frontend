# Архитектура системы авторизации на основе SOLID

## Обзор

Эта система авторизации полностью построена на принципах SOLID, что обеспечивает:
- Легкость тестирования
- Простоту расширения
- Минимальную связанность компонентов
- Высокую переиспользуемость кода

## Применение принципов SOLID

### 1. Single Responsibility Principle (SRP)

**Каждый класс отвечает только за одну задачу:**

#### TokenStorage (`class/storage/token/index.ts`)
- **Ответственность:** Хранение и получение токенов из localStorage
- **Не отвечает за:** Логику авторизации, проверку прав, HTTP запросы

#### GraphQLAdapter (`class/adapter/graphql/index.ts`)
- **Ответственность:** Отправка GraphQL запросов
- **Не отвечает за:** Бизнес-логику авторизации, хранение токенов

#### AuthService (`class/service/auth/index.ts`)
- **Ответственность:** Координация процесса авторизации
- **Не отвечает за:** Детали реализации HTTP, хранение, проверка прав

#### PermissionService (`class/service/permission/index.ts`)
- **Ответственность:** Проверка прав доступа
- **Не отвечает за:** Авторизацию, хранение токенов

#### authStore (`function/store/auth/index.svelte.ts`)
- **Ответственность:** Управление состоянием авторизации
- **Не отвечает за:** Логику авторизации, HTTP запросы

### 2. Open/Closed Principle (OCP)

**Система открыта для расширения, закрыта для модификации**

#### Паттерн Strategy для методов авторизации

```
IAuthStrategy (interface)
    ↑
    ├── EmailPasswordStrategy
    ├── GoogleAuthStrategy
    ├── TelegramAuthStrategy
    └── [Новая стратегия] ← Легко добавить!
```

**Добавление новой стратегии:**

```typescript
// Новая стратегия GitHub OAuth
export class GitHubAuthStrategy implements IAuthStrategy {
  async authenticate(credentials: unknown): Promise<AuthResult<AuthResponse>> {
    // Реализация
  }

  getStrategyName(): string {
    return 'github';
  }
}

// В AuthService просто добавляем метод
async loginWithGitHub(data: GitHubAuthData) {
  const result = await this.githubAuthStrategy.authenticate(data);
  if (result.success) {
    await this.tokenStorage.saveTokens(result.data.tokens);
  }
  return result;
}
```

**Не нужно изменять существующий код!**

### 3. Liskov Substitution Principle (LSP)

**Все реализации IAuthStrategy взаимозаменяемы**

```typescript
// Можно использовать любую стратегию одинаково
const strategies: IAuthStrategy[] = [
  new EmailPasswordStrategy(client),
  new GoogleAuthStrategy(client),
  new TelegramAuthStrategy(client)
];

// Все работают одинаково
for (const strategy of strategies) {
  const result = await strategy.authenticate(credentials);
  console.log(strategy.getStrategyName(), result.success);
}
```

### 4. Interface Segregation Principle (ISP)

**Разделенные интерфейсы вместо одного большого**

#### Вместо одного "God Interface":
```typescript
// ❌ Плохо
interface IAuthService {
  login();
  register();
  logout();
  saveToken();
  getToken();
  clearToken();
  hasPermission();
  hasRole();
  resetPassword();
  verifyEmail();
  // ... еще 20 методов
}
```

#### Используем разделенные интерфейсы:
```typescript
// ✅ Хорошо
interface ITokenStorage {
  saveTokens(tokens: AuthTokens): Promise<void>;
  getTokens(): Promise<AuthTokens | null>;
  clearTokens(): Promise<void>;
}

interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  // Только методы авторизации
}

interface IPermissionChecker {
  hasPermission(resource: string, action: string): boolean;
  hasRole(roleName: string): boolean;
  // Только проверка прав
}

interface IPasswordManager {
  requestPasswordReset(data: PasswordResetRequest): Promise<AuthResult>;
  resetPassword(data: PasswordReset): Promise<AuthResult>;
  // Только управление паролями
}
```

**Преимущества:**
- Клиенты зависят только от нужных методов
- Легче тестировать (меньше методов для мока)
- Ясная ответственность

### 5. Dependency Inversion Principle (DIP)

**Зависимости от абстракций, а не от конкретных реализаций**

#### AuthContext как DI Container

```typescript
class AuthContext {
  // Все зависимости инжектятся через интерфейсы
  public readonly tokenStorage: ITokenStorage;
  public readonly graphqlClient: IGraphQLClient;
  public readonly authService: AuthService;
  public readonly permissionService: PermissionService;

  constructor(graphqlEndpoint: string) {
    // Инициализация зависимостей снизу вверх
    this.tokenStorage = new TokenStorage();
    this.graphqlClient = new GraphQLAdapter(graphqlEndpoint, this.tokenStorage);
    this.authService = new AuthService(this.tokenStorage, this.graphqlClient);
    this.permissionService = new PermissionService(this.graphqlClient);
  }
}
```

#### Инверсия зависимостей в сервисах

```typescript
export class AuthService implements IAuthProvider {
  // ✅ Зависимость от интерфейсов
  constructor(
    private tokenStorage: ITokenStorage,
    private graphqlClient: IGraphQLClient
  ) {}

  // ❌ НЕ зависимость от конкретных классов:
  // constructor(
  //   private tokenStorage: TokenStorage,
  //   private graphqlClient: GraphQLAdapter
  // ) {}
}
```

**Преимущества:**
- Легко заменить реализацию (например, для тестирования)
- Можно использовать разные хранилища (localStorage, sessionStorage, IndexedDB)
- Можно использовать разные HTTP клиенты (fetch, axios, etc.)

## Диаграмма зависимостей

```
┌─────────────────────────────────────────────────┐
│              AuthContext (DI)                    │
│  Управляет созданием и жизненным циклом сервисов │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌──────────────────┐  ┌─────────────────────┐
│   AuthService    │  │  PermissionService  │
│                  │  │                     │
│ ┌──────────────┐ │  │  - hasPermission()  │
│ │  Strategies  │ │  │  - hasRole()        │
│ │  - Email     │ │  │  - canAccess()      │
│ │  - Google    │ │  └─────────────────────┘
│ │  - Telegram  │ │              ▲
│ └──────────────┘ │              │
└──────────────────┘              │
         │                        │
         ▼                        │
┌──────────────────┐              │
│  TokenStorage    │              │
│  - save()        │              │
│  - get()         │              │
│  - clear()       │              │
└──────────────────┘              │
         │                        │
         └────────────────────────┤
                                  │
                          ┌───────┴─────────┐
                          │  GraphQLAdapter │
                          │  - query()      │
                          │  - mutate()     │
                          └─────────────────┘
```

## Слоистая архитектура

```
┌────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (Components из $stylist/auth, хуки, стор) │
│  - AuthGuard / LoginPage ($stylist/auth)   │
│  - useAuth (function/state/auth)           │
│  - authStore (function/store/auth)         │
└────────────────┬───────────────────────────┘
                 │
┌────────────────┴───────────────────────────┐
│         Business Logic Layer                │
│  (Services)                                 │
│  - AuthService                              │
│  - PermissionService                        │
└────────────────┬───────────────────────────┘
                 │
┌────────────────┴───────────────────────────┐
│         Infrastructure Layer                │
│  (Adapters, Storage)                        │
│  - GraphQLAdapter                           │
│  - TokenStorage                             │
└─────────────────────────────────────────────┘
```

## Преимущества данной архитектуры

### 1. Тестируемость

```typescript
// Легко создавать моки
const mockTokenStorage: ITokenStorage = {
  saveTokens: vi.fn(),
  getTokens: vi.fn().mockResolvedValue({ accessToken: 'test', ... }),
  clearTokens: vi.fn()
};

const authService = new AuthService(mockTokenStorage, mockGraphQLClient);
```

### 2. Расширяемость

```typescript
// Добавление новой стратегии без изменения существующего кода
export class AppleAuthStrategy implements IAuthStrategy {
  // Реализация
}
```

### 3. Замена реализаций

```typescript
// Легко заменить localStorage на sessionStorage
const sessionTokenStorage = new TokenStorage(window.sessionStorage);

// Или на IndexedDB
const indexedDBStorage = new IndexedDBTokenStorage();

// Или на Cookie-based storage
const cookieStorage = new CookieTokenStorage();
```

### 4. Независимое развитие модулей

Каждый модуль может развиваться независимо, не влияя на другие:
- Можно поменять способ хранения токенов
- Можно добавить новые методы авторизации
- Можно изменить логику проверки прав
- Можно заменить GraphQL на REST API

## Соответствие лучшим практикам

✅ **Dependency Injection** - Через AuthContext
✅ **Strategy Pattern** - Для методов авторизации
✅ **Repository Pattern** - TokenStorage
✅ **Adapter Pattern** - GraphQLAdapter
✅ **Singleton Pattern** - AuthContext
✅ **Composition over Inheritance** - Все сервисы используют композицию
✅ **Interface-based Design** - Все зависимости через интерфейсы

## Возможности для расширения

### 1. Добавление кеширования

```typescript
export class CachedPermissionService implements IPermissionChecker {
  constructor(
    private permissionService: IPermissionChecker,
    private cache: ICache
  ) {}

  hasPermission(resource: string, action: string): boolean {
    const key = `${resource}:${action}`;
    return this.cache.get(key) ?? this.permissionService.hasPermission(resource, action);
  }
}
```

### 2. Добавление логирования

```typescript
export class LoggedAuthService implements IAuthProvider {
  constructor(
    private authService: IAuthProvider,
    private logger: ILogger
  ) {}

  async login(credentials: LoginCredentials) {
    this.logger.info('Login attempt', { username: credentials.username });
    const result = await this.authService.login(credentials);
    this.logger.info('Login result', { success: result.success });
    return result;
  }
}
```

### 3. Добавление аналитики

```typescript
export class AnalyticsAuthService implements IAuthProvider {
  constructor(
    private authService: IAuthProvider,
    private analytics: IAnalytics
  ) {}

  async login(credentials: LoginCredentials) {
    const result = await this.authService.login(credentials);
    if (result.success) {
      this.analytics.track('user_logged_in');
    }
    return result;
  }
}
```

Все эти расширения можно добавить без изменения существующего кода благодаря принципам SOLID!
