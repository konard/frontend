/**
 * useAuth Composable
 * Предоставляет удобный API для работы с авторизацией в компонентах
 */

import { authStore } from '../../store/auth/index.svelte';
import { getAuthService, getPermissionService } from '../../../class/context/auth';
import type {
	LoginCredentials,
	RegistrationData,
	GoogleAuthData,
	TelegramAuthData,
	PasswordResetRequest,
	PasswordReset,
	EmailVerification,
	Role
} from '$stylist/auth';

export function useAuth() {
	const authService = getAuthService();
	const permissionService = getPermissionService();

	// State - прямые геттеры вместо $derived для корректной реактивности
	const state = {
		get user() { return authStore.user; },
		get isAuthenticated() { return authStore.isAuthenticated; },
		get isLoading() { return authStore.isLoading; },
		get error() { return authStore.error; },
		get roles() { return authStore.roles; }
	};

	// Actions
	async function login(credentials: LoginCredentials) {
		authStore.setLoading(true);
		authStore.setError(null);

		if (import.meta.env.VITE_DEBUG === 'true') {
			console.log('[useAuth] Login attempt with credentials:', { username: credentials.username });
		}

		try {
			const result = await authService.login(credentials);

			if (import.meta.env.VITE_DEBUG === 'true') {
				console.log('[useAuth] Login result:', {
					success: result.success,
					error: result.success ? undefined : result.error
				});
			}

			if (result.success) {
				// Пытаемся загрузить роли, но не блокируем login если это не удалось
				let userRoles: Role[] = [];
				try {
					await permissionService.initialize();
					userRoles = permissionService.getRoles();
				} catch (permError) {
					console.warn('[useAuth] Failed to load user roles, continuing with empty roles:', permError);
				}

				authStore.setAuthenticated(result.data.user, result.data.tokens, userRoles);
			} else {
				authStore.setError(result.error);
			}

			authStore.setLoading(false);
			return result;
		} catch (error) {
			authStore.setLoading(false);
			authStore.setError(error instanceof Error ? error.message : 'Login failed');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Login failed'
			};
		}
	}

	async function loginWithGoogle(data: GoogleAuthData) {
		authStore.setLoading(true);
		authStore.setError(null);

		try {
			const result = await authService.loginWithGoogle(data);

			if (result.success) {
				// Пытаемся загрузить роли, но не блокируем login если это не удалось
				let userRoles: Role[] = [];
				try {
					await permissionService.initialize();
					userRoles = permissionService.getRoles();
				} catch (permError) {
					console.warn('[useAuth] Failed to load user roles, continuing with empty roles:', permError);
				}

				authStore.setAuthenticated(result.data.user, result.data.tokens, userRoles);
			} else {
				authStore.setError(result.error);
			}

			authStore.setLoading(false);
			return result;
		} catch (error) {
			authStore.setLoading(false);
			authStore.setError(error instanceof Error ? error.message : 'Google login failed');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Google login failed'
			};
		}
	}

	async function loginWithTelegram(data: TelegramAuthData) {
		authStore.setLoading(true);
		authStore.setError(null);

		try {
			const result = await authService.loginWithTelegram(data);

			if (result.success) {
				// Пытаемся загрузить роли, но не блокируем login если это не удалось
				let userRoles: Role[] = [];
				try {
					await permissionService.initialize();
					userRoles = permissionService.getRoles();
				} catch (permError) {
					console.warn('[useAuth] Failed to load user roles, continuing with empty roles:', permError);
				}

				authStore.setAuthenticated(result.data.user, result.data.tokens, userRoles);
			} else {
				authStore.setError(result.error);
			}

			authStore.setLoading(false);
			return result;
		} catch (error) {
			authStore.setLoading(false);
			authStore.setError(error instanceof Error ? error.message : 'Telegram login failed');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Telegram login failed'
			};
		}
	}

	async function register(data: RegistrationData) {
		authStore.setLoading(true);
		authStore.setError(null);

		try {
			const result = await authService.register(data);

			if (result.success) {
				// Пытаемся загрузить роли, но не блокируем регистрацию если это не удалось
				let userRoles: Role[] = [];
				try {
					await permissionService.initialize();
					userRoles = permissionService.getRoles();
				} catch (permError) {
					console.warn('[useAuth] Failed to load user roles, continuing with empty roles:', permError);
				}

				authStore.setAuthenticated(result.data.user, result.data.tokens, userRoles);
			} else {
				authStore.setError(result.error);
			}

			authStore.setLoading(false);
			return result;
		} catch (error) {
			authStore.setLoading(false);
			authStore.setError(error instanceof Error ? error.message : 'Registration failed');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Registration failed'
			};
		}
	}

	async function logout() {
		authStore.setLoading(true);
		await authService.logout();
		permissionService.clear();
		authStore.setUnauthenticated();
		authStore.setLoading(false);
	}

	async function refreshToken() {
		const result = await authService.refreshToken();
		return result;
	}

	async function requestPasswordReset(data: PasswordResetRequest) {
		authStore.setLoading(true);
		authStore.setError(null);

		const result = await authService.requestPasswordReset(data);

		if (!result.success) {
			authStore.setError(result.error);
		}

		authStore.setLoading(false);
		return result;
	}

	async function resetPassword(data: PasswordReset) {
		authStore.setLoading(true);
		authStore.setError(null);

		const result = await authService.resetPassword(data);

		if (!result.success) {
			authStore.setError(result.error);
		}

		authStore.setLoading(false);
		return result;
	}

	async function verifyEmail(data: EmailVerification) {
		authStore.setLoading(true);
		authStore.setError(null);

		const result = await authService.verifyEmail(data);

		if (!result.success) {
			authStore.setError(result.error);
		}

		authStore.setLoading(false);
		return result;
	}

	async function resendVerificationEmail(email: string) {
		authStore.setLoading(true);
		authStore.setError(null);

		const result = await authService.resendVerificationEmail(email);

		if (!result.success) {
			authStore.setError(result.error);
		}

		authStore.setLoading(false);
		return result;
	}

	async function checkAuth() {
		authStore.setLoading(true);

		try {
			const result = await authService.getCurrentUser();

			if (result.success) {
				// Пытаемся загрузить роли, но не блокируем auth check если это не удалось
				let userRoles: Role[] = [];
				try {
					await permissionService.initialize();
					userRoles = permissionService.getRoles();
				} catch (permError) {
					console.warn('[useAuth] Failed to load user roles, continuing with empty roles:', permError);
				}

				authStore.setAuthenticated(result.data.user, result.data.tokens, userRoles);
			} else {
				authStore.setUnauthenticated();
			}

			authStore.setLoading(false);
			return result;
		} catch (error) {
			authStore.setLoading(false);
			authStore.setUnauthenticated();
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Auth check failed'
			};
		}
	}

	return {
		// State
		get user() { return state.user; },
		get isAuthenticated() { return state.isAuthenticated; },
		get isLoading() { return state.isLoading; },
		get error() { return state.error; },
		get roles() { return state.roles; },

		// Actions
		login,
		loginWithGoogle,
		loginWithTelegram,
		register,
		logout,
		refreshToken,
		requestPasswordReset,
		resetPassword,
		verifyEmail,
		resendVerificationEmail,
		checkAuth
	};
}

