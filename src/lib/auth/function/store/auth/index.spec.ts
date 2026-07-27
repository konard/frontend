import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from './index.svelte';
import type { User, AuthTokens, Role } from '$stylist/auth';

describe('AuthStore', () => {
	const mockUser: User = {
		id: 1,
		email: 'test@example.com',
		username: 'testuser',
		isActive: true,
		isVerified: true,
		profile: {
			id: 1,
			firstName: 'Test',
			lastName: 'User',
			avatar: null,
			language: 'en',
			timezone: 'UTC'
		}
	};

	const mockTokens: AuthTokens = {
		accessToken: 'test-access-token',
		refreshToken: 'test-refresh-token',
		tokenType: 'Bearer'
	};

	const mockRoles: Role[] = [
		{
			id: 1,
			name: 'admin',
			description: 'Administrator role',
			permissions: [
				{
					id: 1,
					resource: 'users',
					action: 'manage',
					scope: 'all',
					roleId: 1
				}
			]
		}
	];

	beforeEach(() => {
		// Сбрасываем store перед каждым тестом
		authStore.reset();
	});

	describe('initial state', () => {
		it('should have correct initial values', () => {
			expect(authStore.user).toBeNull();
			expect(authStore.tokens).toBeNull();
			expect(authStore.isAuthenticated).toBe(false);
			expect(authStore.isLoading).toBe(false);
			expect(authStore.error).toBeNull();
			expect(authStore.roles).toEqual([]);
		});
	});

	describe('setAuthenticated', () => {
		it('should set user, tokens, and authenticated state', () => {
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);

			expect(authStore.user).toEqual(mockUser);
			expect(authStore.tokens).toEqual(mockTokens);
			expect(authStore.isAuthenticated).toBe(true);
			expect(authStore.roles).toEqual(mockRoles);
			expect(authStore.error).toBeNull();
		});

		it('should work with empty roles array', () => {
			authStore.setAuthenticated(mockUser, mockTokens, []);

			expect(authStore.user).toEqual(mockUser);
			expect(authStore.tokens).toEqual(mockTokens);
			expect(authStore.isAuthenticated).toBe(true);
			expect(authStore.roles).toEqual([]);
		});

		it('should clear any previous errors', () => {
			authStore.setError('Previous error');
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);

			expect(authStore.error).toBeNull();
		});
	});

	describe('setUnauthenticated', () => {
		it('should clear all authentication data', () => {
			// Сначала устанавливаем authenticated state
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);

			// Затем вызываем setUnauthenticated
			authStore.setUnauthenticated();

			expect(authStore.user).toBeNull();
			expect(authStore.tokens).toBeNull();
			expect(authStore.isAuthenticated).toBe(false);
			expect(authStore.roles).toEqual([]);
			expect(authStore.error).toBeNull();
		});
	});

	describe('setLoading', () => {
		it('should set loading state to true', () => {
			authStore.setLoading(true);
			expect(authStore.isLoading).toBe(true);
		});

		it('should set loading state to false', () => {
			authStore.setLoading(true);
			authStore.setLoading(false);
			expect(authStore.isLoading).toBe(false);
		});
	});

	describe('setError', () => {
		it('should set error message', () => {
			const errorMessage = 'Authentication failed';
			authStore.setError(errorMessage);
			expect(authStore.error).toBe(errorMessage);
		});

		it('should clear error message with null', () => {
			authStore.setError('Some error');
			authStore.setError(null);
			expect(authStore.error).toBeNull();
		});
	});

	describe('setRoles', () => {
		it('should update roles', () => {
			authStore.setRoles(mockRoles);
			expect(authStore.roles).toEqual(mockRoles);
		});

		it('should replace existing roles', () => {
			authStore.setRoles(mockRoles);
			const newRoles: Role[] = [
				{
					id: 2,
					name: 'user',
					description: 'Regular user',
					permissions: []
				}
			];
			authStore.setRoles(newRoles);
			expect(authStore.roles).toEqual(newRoles);
		});
	});

	describe('updateUser', () => {
		it('should update user properties', () => {
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);

			authStore.updateUser({ username: 'newusername' });

			expect(authStore.user?.username).toBe('newusername');
			expect(authStore.user?.email).toBe('test@example.com'); // Other properties unchanged
		});

		it('should do nothing if user is null', () => {
			authStore.updateUser({ username: 'newusername' });
			expect(authStore.user).toBeNull();
		});

		it('should update profile properties', () => {
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);

			authStore.updateUser({
				profile: {
					...mockUser.profile!,
					firstName: 'Updated'
				}
			});

			expect(authStore.user?.profile?.firstName).toBe('Updated');
		});
	});

	describe('reset', () => {
		it('should reset all state to initial values', () => {
			// Set some state
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);
			authStore.setError('Some error');
			authStore.setLoading(true);

			// Reset
			authStore.reset();

			// Check all values are reset
			expect(authStore.user).toBeNull();
			expect(authStore.tokens).toBeNull();
			expect(authStore.isAuthenticated).toBe(false);
			expect(authStore.isLoading).toBe(false);
			expect(authStore.error).toBeNull();
			expect(authStore.roles).toEqual([]);
		});
	});

	describe('state transitions', () => {
		it('should handle complete login -> logout flow', () => {
			// Initial state
			expect(authStore.isAuthenticated).toBe(false);

			// Loading
			authStore.setLoading(true);
			expect(authStore.isLoading).toBe(true);

			// Login success
			authStore.setAuthenticated(mockUser, mockTokens, mockRoles);
			authStore.setLoading(false);
			expect(authStore.isAuthenticated).toBe(true);
			expect(authStore.isLoading).toBe(false);

			// Logout
			authStore.setUnauthenticated();
			expect(authStore.isAuthenticated).toBe(false);
			expect(authStore.user).toBeNull();
		});

		it('should handle login error flow', () => {
			// Initial state
			expect(authStore.isAuthenticated).toBe(false);

			// Loading
			authStore.setLoading(true);
			expect(authStore.isLoading).toBe(true);

			// Login error
			authStore.setError('Invalid credentials');
			authStore.setLoading(false);
			expect(authStore.error).toBe('Invalid credentials');
			expect(authStore.isLoading).toBe(false);
			expect(authStore.isAuthenticated).toBe(false);
		});
	});
});

