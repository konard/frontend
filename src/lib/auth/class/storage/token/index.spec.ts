import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenStorage } from './index';
import type { AuthTokens } from '$stylist/auth';
import { STORAGE_KEYS } from '$stylist/auth';

describe('TokenStorage', () => {
	let storage: TokenStorage;
	let mockStorage: Storage;

	beforeEach(() => {
		// Создаем мок для localStorage
		mockStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			key: vi.fn(),
			length: 0
		};

		storage = new TokenStorage(mockStorage);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('saveTokens', () => {
		it('should save all tokens to storage', async () => {
			const tokens: AuthTokens = {
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				tokenType: 'Bearer'
			};

			await storage.saveTokens(tokens);

			expect(mockStorage.setItem).toHaveBeenCalledWith(
				STORAGE_KEYS.ACCESS_TOKEN,
				'test-access-token'
			);
			expect(mockStorage.setItem).toHaveBeenCalledWith(
				STORAGE_KEYS.REFRESH_TOKEN,
				'test-refresh-token'
			);
			expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.TOKEN_TYPE, 'Bearer');
			expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
		});

		it('should handle errors when saving tokens', async () => {
			const tokens: AuthTokens = {
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				tokenType: 'Bearer'
			};

			vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			await expect(storage.saveTokens(tokens)).rejects.toThrow(
				'Failed to save authentication tokens'
			);
		});
	});

	describe('getTokens', () => {
		it('should return tokens when all tokens exist', async () => {
			vi.spyOn(mockStorage, 'getItem').mockImplementation((key: string) => {
				const tokens: Record<string, string> = {
					[STORAGE_KEYS.ACCESS_TOKEN]: 'test-access-token',
					[STORAGE_KEYS.REFRESH_TOKEN]: 'test-refresh-token',
					[STORAGE_KEYS.TOKEN_TYPE]: 'Bearer'
				};
				return tokens[key] || null;
			});

			const tokens = await storage.getTokens();

			expect(tokens).toEqual({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				tokenType: 'Bearer'
			});
		});

		it('should return null when any token is missing', async () => {
			vi.spyOn(mockStorage, 'getItem').mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.ACCESS_TOKEN) {
					return 'test-access-token';
				}
				return null;
			});

			const tokens = await storage.getTokens();

			expect(tokens).toBeNull();
		});

		it('should return null when storage throws error', async () => {
			vi.spyOn(mockStorage, 'getItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			const tokens = await storage.getTokens();

			expect(tokens).toBeNull();
		});
	});

	describe('clearTokens', () => {
		it('should remove all tokens from storage', async () => {
			await storage.clearTokens();

			expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
			expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
			expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.TOKEN_TYPE);
			expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);
			expect(mockStorage.removeItem).toHaveBeenCalledTimes(4);
		});

		it('should handle errors when clearing tokens', async () => {
			vi.spyOn(mockStorage, 'removeItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			await expect(storage.clearTokens()).rejects.toThrow(
				'Failed to clear authentication tokens'
			);
		});
	});

	describe('getAccessToken', () => {
		it('should return access token when it exists', async () => {
			vi.spyOn(mockStorage, 'getItem').mockReturnValue('test-access-token');

			const token = await storage.getAccessToken();

			expect(token).toBe('test-access-token');
			expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
		});

		it('should return null when access token does not exist', async () => {
			vi.spyOn(mockStorage, 'getItem').mockReturnValue(null);

			const token = await storage.getAccessToken();

			expect(token).toBeNull();
		});

		it('should return null when storage throws error', async () => {
			vi.spyOn(mockStorage, 'getItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			const token = await storage.getAccessToken();

			expect(token).toBeNull();
		});
	});

	describe('getRefreshToken', () => {
		it('should return refresh token when it exists', async () => {
			vi.spyOn(mockStorage, 'getItem').mockReturnValue('test-refresh-token');

			const token = await storage.getRefreshToken();

			expect(token).toBe('test-refresh-token');
			expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
		});

		it('should return null when refresh token does not exist', async () => {
			vi.spyOn(mockStorage, 'getItem').mockReturnValue(null);

			const token = await storage.getRefreshToken();

			expect(token).toBeNull();
		});

		it('should return null when storage throws error', async () => {
			vi.spyOn(mockStorage, 'getItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			const token = await storage.getRefreshToken();

			expect(token).toBeNull();
		});
	});
});

