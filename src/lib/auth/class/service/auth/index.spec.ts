import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './index';
import type { ITokenStorage, IGraphQLClient } from '$stylist/auth';
import type {
	LoginCredentials,
	RegistrationData,
	GoogleAuthData,
	TelegramAuthData,
	PasswordResetRequest,
	PasswordReset,
	EmailVerification,
	User,
	AuthTokens
} from '$stylist/auth';

describe('AuthService', () => {
	let authService: AuthService;
	let mockTokenStorage: ITokenStorage;
	let mockGraphQLClient: IGraphQLClient;

	const mockTokens: AuthTokens = {
		accessToken: 'test-access-token',
		refreshToken: 'test-refresh-token',
		tokenType: 'Bearer'
	};

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

	beforeEach(() => {
		mockTokenStorage = {
			saveTokens: vi.fn(),
			getTokens: vi.fn(),
			clearTokens: vi.fn(),
			getAccessToken: vi.fn(),
			getRefreshToken: vi.fn()
		};

		mockGraphQLClient = {
			query: vi.fn(),
			mutate: vi.fn()
		};

		authService = new AuthService(mockTokenStorage, mockGraphQLClient);
	});

	describe('login', () => {
		const credentials: LoginCredentials = {
			username: 'testuser',
			password: 'password123'
		};

		it('should login successfully and save tokens', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				login: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await authService.login(credentials);

			expect(result.success).toBe(true);
			expect(result.data?.user).toEqual(mockUser);
			expect(result.data?.tokens).toEqual(mockTokens);
			expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockTokens);
		});

		it('should not save tokens on failed login', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid credentials')
			);

			const result = await authService.login(credentials);

			expect(result.success).toBe(false);
			expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled();
		});
	});

	describe('loginWithGoogle', () => {
		const googleData: GoogleAuthData = {
			idToken: 'google-id-token'
		};

		it('should login with Google and save tokens', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithGoogle: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await authService.loginWithGoogle(googleData);

			expect(result.success).toBe(true);
			expect(result.data?.user).toEqual(mockUser);
			expect(result.data?.tokens).toEqual(mockTokens);
			expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockTokens);
		});

		it('should not save tokens on failed Google login', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid Google token')
			);

			const result = await authService.loginWithGoogle(googleData);

			expect(result.success).toBe(false);
			expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled();
		});
	});

	describe('loginWithTelegram', () => {
		const telegramData: TelegramAuthData = {
			id: 123456789,
			hash: 'telegram-hash',
			authDate: 1234567890,
			firstName: 'Test'
		};

		it('should login with Telegram and save tokens', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				loginWithTelegram: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await authService.loginWithTelegram(telegramData);

			expect(result.success).toBe(true);
			expect(result.data?.user).toEqual(mockUser);
			expect(result.data?.tokens).toEqual(mockTokens);
			expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockTokens);
		});

		it('should not save tokens on failed Telegram login', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid Telegram auth')
			);

			const result = await authService.loginWithTelegram(telegramData);

			expect(result.success).toBe(false);
			expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled();
		});
	});

	describe('register', () => {
		const registrationData: RegistrationData = {
			email: 'new@example.com',
			username: 'newuser',
			password: 'password123',
			firstName: 'New',
			lastName: 'User'
		};

		it('should register successfully and save tokens', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				register: mockTokens
			});

			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await authService.register(registrationData);

			expect(result.success).toBe(true);
			expect(result.data?.user).toEqual(mockUser);
			expect(result.data?.tokens).toEqual(mockTokens);
			expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(mockTokens);
		});

		it('should handle registration errors', async () => {
			const errorMessage = 'Email already exists';
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(new Error(errorMessage));

			const result = await authService.register(registrationData);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
		});
	});

	describe('logout', () => {
		it('should clear tokens on logout', async () => {
			await authService.logout();

			expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
		});
	});

	describe('refreshToken', () => {
		it('should refresh token successfully', async () => {
			const newTokens: AuthTokens = {
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
				tokenType: 'Bearer'
			};

			vi.spyOn(mockTokenStorage, 'getRefreshToken').mockResolvedValue('old-refresh-token');
			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				refreshToken: newTokens
			});

			const result = await authService.refreshToken();

			expect(result.success).toBe(true);
			expect(result.data).toEqual(newTokens);
			expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(newTokens);
		});

		it('should fail when no refresh token available', async () => {
			vi.spyOn(mockTokenStorage, 'getRefreshToken').mockResolvedValue(null);

			const result = await authService.refreshToken();

			expect(result.success).toBe(false);
			expect(result.error).toBe('No refresh token available');
		});

		it('should handle refresh token errors', async () => {
			vi.spyOn(mockTokenStorage, 'getRefreshToken').mockResolvedValue('old-refresh-token');
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid refresh token')
			);

			const result = await authService.refreshToken();

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid refresh token');
		});
	});

	describe('getCurrentUser', () => {
		it('should get current user successfully', async () => {
			vi.spyOn(mockTokenStorage, 'getTokens').mockResolvedValue(mockTokens);
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				me: mockUser
			});

			const result = await authService.getCurrentUser();

			expect(result.success).toBe(true);
			expect(result.data?.user).toEqual(mockUser);
			expect(result.data?.tokens).toEqual(mockTokens);
		});

		it('should fail when not authenticated', async () => {
			vi.spyOn(mockTokenStorage, 'getTokens').mockResolvedValue(null);

			const result = await authService.getCurrentUser();

			expect(result.success).toBe(false);
			expect(result.error).toBe('Not authenticated');
		});

		it('should handle user fetch errors', async () => {
			vi.spyOn(mockTokenStorage, 'getTokens').mockResolvedValue(mockTokens);
			vi.spyOn(mockGraphQLClient, 'query').mockRejectedValue(
				new Error('User not found')
			);

			const result = await authService.getCurrentUser();

			expect(result.success).toBe(false);
			expect(result.error).toBe('User not found');
		});
	});

	describe('requestPasswordReset', () => {
		const resetRequest: PasswordResetRequest = {
			email: 'test@example.com'
		};

		it('should request password reset successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Password reset email sent'
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				requestPasswordReset: mockResponse
			});

			const result = await authService.requestPasswordReset(resetRequest);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});

		it('should handle password reset request errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Email not found')
			);

			const result = await authService.requestPasswordReset(resetRequest);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Email not found');
		});
	});

	describe('resetPassword', () => {
		const resetData: PasswordReset = {
			token: 'reset-token',
			newPassword: 'newPassword123'
		};

		it('should reset password successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Password reset successful'
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				resetPassword: mockResponse
			});

			const result = await authService.resetPassword(resetData);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});

		it('should handle password reset errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid or expired token')
			);

			const result = await authService.resetPassword(resetData);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid or expired token');
		});
	});

	describe('verifyEmail', () => {
		const verificationData: EmailVerification = {
			token: 'verification-token'
		};

		it('should verify email successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Email verified successfully'
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				verifyEmail: mockResponse
			});

			const result = await authService.verifyEmail(verificationData);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});

		it('should handle email verification errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Invalid verification token')
			);

			const result = await authService.verifyEmail(verificationData);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid verification token');
		});
	});

	describe('resendVerificationEmail', () => {
		const email = 'test@example.com';

		it('should resend verification email successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Verification email sent'
			};

			vi.spyOn(mockGraphQLClient, 'mutate').mockResolvedValue({
				resendVerificationEmail: mockResponse
			});

			const result = await authService.resendVerificationEmail(email);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});

		it('should handle resend verification errors', async () => {
			vi.spyOn(mockGraphQLClient, 'mutate').mockRejectedValue(
				new Error('Email already verified')
			);

			const result = await authService.resendVerificationEmail(email);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Email already verified');
		});
	});
});

