import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelegramAuthStrategy } from './index';
import type { IGraphQLClient } from '$stylist/auth';
import type { TelegramAuthData, User } from '$stylist/auth';
import { AUTH_STRATEGIES } from '$stylist/auth';

describe('TelegramAuthStrategy', () => {
	let strategy: TelegramAuthStrategy;
	let mockGraphQLClient: IGraphQLClient;

	const mockTokens = {
		accessToken: 'telegram-access-token',
		refreshToken: 'telegram-refresh-token',
		tokenType: 'Bearer'
	};

	const mockUser: User = {
		id: 1,
		email: 'telegram@example.com',
		username: 'telegramuser',
		isActive: true,
		isVerified: true,
		profile: {
			id: 1,
			firstName: 'Telegram',
			lastName: 'User',
			avatar: 'https://t.me/i/userpic/320/photo.jpg',
			language: 'en',
			timezone: 'UTC'
		}
	};

	beforeEach(() => {
		mockGraphQLClient = {
			query: vi.fn(),
			mutate: vi.fn()
		};

		strategy = new TelegramAuthStrategy(mockGraphQLClient);
	});

	describe('getStrategyName', () => {
		it('should return correct strategy name', () => {
			expect(strategy.getStrategyName()).toBe(AUTH_STRATEGIES.TELEGRAM);
		});
	});

	describe('authenticate', () => {
		const validTelegramData: TelegramAuthData = {
			id: 123456789,
			hash: 'telegram-hash-example',
			authDate: 1234567890,
			firstName: 'Telegram',
			lastName: 'User',
			username: 'telegramuser',
			photoUrl: 'https://t.me/i/userpic/320/photo.jpg'
		};

		it('should authenticate successfully with valid Telegram data', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				user: mockUser,
				tokens: mockTokens
			});

			expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
				expect.stringContaining('mutation LoginWithTelegram'),
				{
					input: {
						id: validTelegramData.id,
						hash: validTelegramData.hash,
						authDate: validTelegramData.authDate,
						firstName: validTelegramData.firstName,
						lastName: validTelegramData.lastName,
						username: validTelegramData.username,
						photoUrl: validTelegramData.photoUrl
					}
				}
			);

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.stringContaining('query Me'),
				undefined,
				mockTokens.accessToken
			);
		});

		it('should authenticate with minimal Telegram data', async () => {
			const minimalTelegramData: TelegramAuthData = {
				id: 123456789,
				hash: 'telegram-hash-example',
				authDate: 1234567890,
				firstName: 'User'
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await strategy.authenticate(minimalTelegramData);

			expect(result.success).toBe(true);
			expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
				expect.any(String),
				{
					input: {
						id: minimalTelegramData.id,
						hash: minimalTelegramData.hash,
						authDate: minimalTelegramData.authDate,
						firstName: minimalTelegramData.firstName,
						lastName: undefined,
						username: undefined,
						photoUrl: undefined
					}
				}
			);
		});

		it('should handle invalid Telegram hash', async () => {
			const errorMessage = 'Invalid Telegram authentication hash';
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});

		it('should handle expired Telegram auth', async () => {
			const errorMessage = 'Telegram authentication has expired';
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});

		it('should handle user data fetch errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			const errorMessage = 'Failed to fetch Telegram user data';
			vi.spyOn(mockGraphQLClient, 'query').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});

		it('should handle non-Error exceptions', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue('Network error');

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Telegram authentication failed');
		});

		it('should pass access token to user data query', async () => {
			const customAccessToken = 'custom-telegram-access-token';
			const customTokens = {
				...mockTokens,
				accessToken: customAccessToken
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: customTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			await strategy.authenticate(validTelegramData);

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.any(String),
				undefined,
				customAccessToken
			);
		});

		it('should handle Telegram user with photo URL', async () => {
			const userWithPhoto = {
				...mockUser,
				profile: {
					...mockUser.profile!,
					avatar: 'https://t.me/i/userpic/320/custom_photo.jpg'
				}
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: userWithPhoto
			});

			const result = await strategy.authenticate(validTelegramData);

			expect(result.success).toBe(true);
			expect(result.data?.user.profile?.avatar).toBe('https://t.me/i/userpic/320/custom_photo.jpg');
		});

		it('should handle Telegram data without username', async () => {
			const dataWithoutUsername: TelegramAuthData = {
				...validTelegramData,
				username: undefined
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await strategy.authenticate(dataWithoutUsername);

			expect(result.success).toBe(true);
			expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					input: expect.objectContaining({
						username: undefined
					})
				})
			);
		});
	});
});

