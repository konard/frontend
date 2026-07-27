# Примеры использования Auth Module

## Полные примеры страниц

### Страница входа (Login Page)

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { useAuth } from '$lib/auth';
  import { goto } from '$app/navigation';

  let username = $state('');
  let password = $state('');

  const auth = useAuth();

  async function handleSubmit() {
    const result = await auth.login({ username, password });

    if (result.success) {
      goto('/dashboard');
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="mt-8 space-y-6">
      <div class="rounded-md shadow-sm space-y-4">
        <div>
          <label for="username" class="sr-only">Username</label>
          <input
            id="username"
            type="text"
            required
            bind:value={username}
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Username"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            type="password"
            required
            bind:value={password}
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      {#if auth.error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">
            {auth.error}
          </div>
        </div>
      {/if}

      <div>
        <button
          type="submit"
          disabled={auth.isLoading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {auth.isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div class="text-sm text-center">
        <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
          Don't have an account? Sign up
        </a>
      </div>
    </form>
  </div>
</div>
```

### Защищенная страница Dashboard

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { AuthGuard, useAuth, usePermissions } from '$lib/auth';

  const auth = useAuth();
  const permissions = usePermissions();

  async function handleLogout() {
    await auth.logout();
    window.location.href = '/login';
  }
</script>

<AuthGuard>
  {#snippet children()}
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold">Dashboard</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span>Welcome, {auth.user?.username}!</span>
              <button
                onclick={handleLogout}
                class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Card 1 -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <h3 class="text-lg font-medium text-gray-900">Profile</h3>
                <p class="mt-1 text-sm text-gray-500">Manage your account</p>
              </div>
            </div>

            <!-- Card 2 - Only for users with permission -->
            {#if permissions.hasPermission('articles', 'create')}
              <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                  <h3 class="text-lg font-medium text-gray-900">Create Article</h3>
                  <p class="mt-1 text-sm text-gray-500">Write a new article</p>
                </div>
              </div>
            {/if}

            <!-- Card 3 - Only for admins -->
            {#if permissions.hasRole('admin')}
              <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                  <h3 class="text-lg font-medium text-gray-900">Admin Panel</h3>
                  <p class="mt-1 text-sm text-gray-500">Manage system settings</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </main>
    </div>
  {/snippet}
</AuthGuard>
```

### Layout с проверкой авторизации

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { useAuth } from '$lib/auth';

  const auth = useAuth();

  onMount(async () => {
    // Проверяем авторизацию при загрузке приложения
    await auth.checkAuth();
  });
</script>

{#if auth.isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{:else}
  <slot />
{/if}
```

### Страница профиля с редактированием

```svelte
<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import { AuthGuard, useAuth } from '$lib/auth';

  const auth = useAuth();

  let firstName = $state(auth.user?.profile?.firstName || '');
  let lastName = $state(auth.user?.profile?.lastName || '');
  let editing = $state(false);

  async function handleSave() {
    // Здесь должен быть вызов API для обновления профиля
    console.log('Saving profile:', { firstName, lastName });
    editing = false;
  }
</script>

<AuthGuard>
  {#snippet children()}
  <div class="max-w-2xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6">Profile</h1>

    <div class="bg-white shadow rounded-lg p-6">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Username</label>
          <p class="mt-1 text-sm text-gray-900">{auth.user?.username}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <p class="mt-1 text-sm text-gray-900">{auth.user?.email}</p>
          {#if !auth.user?.isVerified}
            <span class="text-xs text-red-600">Not verified</span>
          {/if}
        </div>

        {#if editing}
          <div>
            <label class="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              bind:value={firstName}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              bind:value={lastName}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div class="flex space-x-2">
            <button
              onclick={handleSave}
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              onclick={() => editing = false}
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        {:else}
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <p class="mt-1 text-sm text-gray-900">
              {auth.user?.profile?.firstName || ''} {auth.user?.profile?.lastName || ''}
            </p>
          </div>

          <button
            onclick={() => editing = true}
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Edit Profile
          </button>
        {/if}

        <div class="pt-4 border-t">
          <h3 class="text-lg font-medium mb-2">Roles</h3>
          <div class="flex flex-wrap gap-2">
            {#each auth.roles as role}
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {role.name}
              </span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  {/snippet}
</AuthGuard>
```

### Компонент навигации с условным рендерингом

```svelte
<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
  import { useAuth, usePermissions } from '$lib/auth';

  const auth = useAuth();
  const permissions = usePermissions();

  async function handleLogout() {
    await auth.logout();
    window.location.href = '/';
  }
</script>

<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex space-x-8">
        <a href="/" class="flex items-center">Home</a>

        {#if auth.isAuthenticated}
          <a href="/dashboard" class="flex items-center">Dashboard</a>

          {#if permissions.hasPermission('articles', 'read')}
            <a href="/articles" class="flex items-center">Articles</a>
          {/if}

          {#if permissions.hasRole('admin')}
            <a href="/admin" class="flex items-center">Admin</a>
          {/if}
        {/if}
      </div>

      <div class="flex items-center space-x-4">
        {#if auth.isAuthenticated}
          <span class="text-sm text-gray-700">
            {auth.user?.username}
          </span>
          <button
            onclick={handleLogout}
            class="text-sm text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        {:else}
          <a href="/login" class="text-sm text-gray-700 hover:text-gray-900">
            Login
          </a>
          <a href="/register" class="text-sm text-indigo-600 hover:text-indigo-800">
            Sign up
          </a>
        {/if}
      </div>
    </div>
  </div>
</nav>
```

## Интеграция с SvelteKit Hooks

```typescript
// src/hooks.server.ts
import { getAuthService } from '$lib/auth';

export async function handle({ event, resolve }) {
  const authHeader = event.request.headers.get('authorization');

  if (authHeader) {
    // Валидация токена на сервере
    const token = authHeader.replace('Bearer ', '');
    // Логика валидации...
  }

  const response = await resolve(event);
  return response;
}
```

## Использование с формами SvelteKit

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { useAuth } from '$lib/auth';

  const auth = useAuth();
</script>

<form
  method="POST"
  use:enhance={async ({ formData }) => {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const result = await auth.login({ username, password });

    if (result.success) {
      return { type: 'redirect', location: '/dashboard' };
    }

    return { type: 'failure' };
  }}
>
  <input name="username" type="text" required />
  <input name="password" type="password" required />
  <button type="submit">Login</button>
</form>
```
