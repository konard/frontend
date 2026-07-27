import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAuthStrategy } from './index';
import type { IGraphQLClient } from '$stylist/auth';
import type { GoogleAuthData, User } from '$stylist/auth';
import { AUTH_STRATEGIES } from '$stylist/auth';

describe('GoogleAuthStrategy', () => {
	let strategy: GoogleAuthStrategy;
	let mockGraphQLClient: IGraphQLClient;

	const mockTokens = {
		accessToken: 'google-access-token',
		refreshToken: 'google-refresh-token',
		tokenType: 'Bearer'
	};

	const mockUser: User = {
		id: 1,
		email: 'test@gmail.com',
		username: 'googleuser',
		isActive: true,
		isVerified: true,
		profile: {
			id: 1,
			firstName: 'Google',
			lastName: 'User',
			avatar: 'https://example.com/avatar.jpg',
			language: 'en',
			timezone: 'UTC'
		}
	};

	beforeEach(() => {
		mockGraphQLClient = {
			query: vi.fn(),
			mutate: vi.fn()
		};

		strategy = new GoogleAuthStrategy(mockGraphQLClient);
	});

	describe('getStrategyName', () => {
		it('should return correct strategy name', () => {
			expect(strategy.getStrategyName()).toBe(AUTH_STRATEGIES.GOOGLE);
		});
	});

	describe('authenticate', () => {
		const validGoogleData: GoogleAuthData = {
			idToken: 'google-id-token-example'
		};

		it('should authenticate successfully with valid Google token', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithGoogle: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				user: mockUser,
				tokens: mockTokens
			});

			expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
				expect.stringContaining('mutation LoginWithGoogle'),
				{
					input: {
						idToken: validGoogleData.idToken
					}
				}
			);

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.stringContaining('query Me'),
				undefined,
				mockTokens.accessToken
			);
		});

		it('should handle invalid Google token', async () => {
			const errorMessage = 'Invalid Google ID token';
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});

		it('should handle user data fetch errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithGoogle: mockTokens
			});

			const errorMessage = 'Failed to fetch Google user data';
			vi.spyOn(mockGraphQLClient, 'query').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});

		it('should handle non-Error exceptions', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue('Network error');

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Google authentication failed');
		});

		it('should pass access token to user data query', async () => {
			const customAccessToken = 'custom-google-access-token';
			const customTokens = {
				...mockTokens,
				accessToken: customAccessToken
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithGoogle: customTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			await strategy.authenticate(validGoogleData);

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.any(String),
				undefined,
				customAccessToken
			);
		});

		it('should handle Google user with avatar', async () => {
			const userWithAvatar = {
				...mockUser,
				profile: {
					...mockUser.profile!,
					avatar: 'https://lh3.googleusercontent.com/avatar.jpg'
				}
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithGoogle: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: userWithAvatar
			});

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(true);
			expect(result.data?.user.profile?.avatar).toBe('https://lh3.googleusercontent.com/avatar.jpg');
		});

		it('should handle expired Google token', async () => {
			const errorMessage = 'Google token has expired';
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(new Error(errorMessage));

			const result = await strategy.authenticate(validGoogleData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});
	});
});

