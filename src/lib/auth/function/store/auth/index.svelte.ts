/**
 * Auth Store (Svelte 5 Runes)
 * SRP: Управляет состоянием авторизации
 */

import type { User, AuthTokens, Role } from '$stylist/auth';

type AuthStoreState = {
	user: User | null;
	tokens: AuthTokens | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	roles: Role[];
};

class AuthStore {
	private state = $state<AuthStoreState>({
		user: null,
		tokens: null,
		isAuthenticated: false,
		isLoading: false,
		error: null,
		roles: []
	});

	// Getters
	get user() {
		return this.state.user;
	}

	get tokens() {
		return this.state.tokens;
	}

	get isAuthenticated() {
		return this.state.isAuthenticated;
	}

	get isLoading() {
		return this.state.isLoading;
	}

	get error() {
		return this.state.error;
	}

	get roles() {
		return this.state.roles;
	}

	// Setters
	setAuthenticated(user: User, tokens: AuthTokens, roles: Role[] = []) {
		this.state.user = user;
		this.state.tokens = tokens;
		this.state.isAuthenticated = true;
		this.state.roles = roles;
		this.state.error = null;
	}

	setUnauthenticated() {
		this.state.user = null;
		this.state.tokens = null;
		this.state.isAuthenticated = false;
		this.state.roles = [];
		this.state.error = null;
	}

	setLoading(isLoading: boolean) {
		this.state.isLoading = isLoading;
	}

	setError(error: string | null) {
		this.state.error = error;
	}

	setRoles(roles: Role[]) {
		this.state.roles = roles;
	}

	updateUser(user: Partial<User>) {
		if (this.state.user) {
			this.state.user = { ...this.state.user, ...user };
		}
	}

	// Reset
	reset() {
		this.state = {
			user: null,
			tokens: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
			roles: []
		};
	}
}

export const authStore = new AuthStore();

