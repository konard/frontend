/**
 * Auth Module - Main Export
 * Экспортирует все публичные API модуля авторизации
 */

export * from '$stylist/auth';

// Services
export { AuthService } from './class/service/auth';
export { PermissionService } from './class/service/permission';

// Context
export { authContext, getAuthService, getPermissionService, getTokenStorage } from './class/context/auth';

// Stores
export { authStore } from './function/store/auth/index.svelte';

// Composables
export { useAuth } from './function/state/auth/index.svelte';
export { usePermissions } from './function/state/permissions/index.svelte';

// UI компоненты авторизации перенесены в $stylist/auth/component/organism/auth-guard


