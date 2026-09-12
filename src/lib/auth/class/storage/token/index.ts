/**
 * Token Storage Implementation
 * SRP: Отвечает только за хранение и получение токенов
 */

import type { ITokenStorage } from '$stylist/auth';
import type { AuthTokens } from '$stylist/auth';
import { STORAGE_KEYS } from '$stylist/auth';

export class TokenStorage implements ITokenStorage {
	private storage: Storage;

	constructor(storage: Storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage)) {
		this.storage = storage;
	}

	async saveTokens(tokens: AuthTokens): Promise<void> {
		try {
			this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
			this.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
			this.storage.setItem(STORAGE_KEYS.TOKEN_TYPE, tokens.tokenType);
		} catch (error) {
			console.error('Failed to save tokens:', error);
			throw new Error('Failed to save authentication tokens');
		}
	}

	async getTokens(): Promise<AuthTokens | null> {
		try {
			const accessToken = this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
			const refreshToken = this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
			const tokenType = this.storage.getItem(STORAGE_KEYS.TOKEN_TYPE);

			if (!accessToken || !refreshToken || !tokenType) {
				return null;
			}

			return {
				accessToken,
				refreshToken,
				tokenType
			};
		} catch (error) {
			console.error('Failed to get tokens:', error);
			return null;
		}
	}

	async clearTokens(): Promise<void> {
		try {
			this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
			this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
			this.storage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
			this.storage.removeItem(STORAGE_KEYS.USER_DATA);
		} catch (error) {
			console.error('Failed to clear tokens:', error);
			throw new Error('Failed to clear authentication tokens');
		}
	}

	async getAccessToken(): Promise<string | null> {
		try {
			return this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
		} catch (error) {
			console.error('Failed to get access token:', error);
			return null;
		}
	}

	async getRefreshToken(): Promise<string | null> {
		try {
			return this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
		} catch (error) {
			console.error('Failed to get refresh token:', error);
			return null;
		}
	}
}

