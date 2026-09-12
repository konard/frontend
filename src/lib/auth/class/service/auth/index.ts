/**
 * Authentication Service
 * SRP: Отвечает за координацию процесса авторизации
 * DIP: Зависит от абстракций (интерфейсов), а не от конкретных реализаций
 * OCP: Открыт для расширения через добавление новых стратегий
 */

import type {
	IAuthProvider,
	IPasswordManager,
	IEmailVerification,
	ITokenStorage,
	IGraphQLClient
} from '$stylist/auth';
import type {
	LoginCredentials,
	RegistrationData,
	GoogleAuthData,
	TelegramAuthData,
	PasswordResetRequest,
	PasswordReset,
	EmailVerification,
	AuthResponse,
	AuthTokens,
	MessageResponse,
	AuthResult
} from '$stylist/auth';
import { EmailPasswordStrategy } from '../../strategy/email-password';
import { GoogleAuthStrategy } from '../../strategy/google-auth';
import { TelegramAuthStrategy } from '../../strategy/telegram-auth';

export class AuthService implements IAuthProvider, IPasswordManager, IEmailVerification {
	private tokenStorage: ITokenStorage;
	private graphqlClient: IGraphQLClient;
	private emailPasswordStrategy: EmailPasswordStrategy;
	private googleAuthStrategy: GoogleAuthStrategy;
	private telegramAuthStrategy: TelegramAuthStrategy;

	constructor(tokenStorage: ITokenStorage, graphqlClient: IGraphQLClient) {
		this.tokenStorage = tokenStorage;
		this.graphqlClient = graphqlClient;

		// Инициализируем стратегии
		this.emailPasswordStrategy = new EmailPasswordStrategy(graphqlClient);
		this.googleAuthStrategy = new GoogleAuthStrategy(graphqlClient);
		this.telegramAuthStrategy = new TelegramAuthStrategy(graphqlClient);
	}

	// ============= Login Methods =============

	async login(credentials: LoginCredentials): Promise<AuthResult<AuthResponse>> {
		const result = await this.emailPasswordStrategy.authenticate(credentials);

		if (result.success) {
			await this.tokenStorage.saveTokens(result.data.tokens);
		}

		return result;
	}

	async loginWithGoogle(data: GoogleAuthData): Promise<AuthResult<AuthResponse>> {
		const result = await this.googleAuthStrategy.authenticate(data);

		if (result.success) {
			await this.tokenStorage.saveTokens(result.data.tokens);
		}

		return result;
	}

	async loginWithTelegram(data: TelegramAuthData): Promise<AuthResult<AuthResponse>> {
		const result = await this.telegramAuthStrategy.authenticate(data);

		if (result.success) {
			await this.tokenStorage.saveTokens(result.data.tokens);
		}

		return result;
	}

	// ============= Registration =============

	async register(data: RegistrationData): Promise<AuthResult<AuthResponse>> {
		try {
			const mutation = `
				mutation Register($input: UserRegistrationInput!) {
					register(input: $input) {
						accessToken
						refreshToken
						tokenType
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ register: AuthTokens }>(
				mutation,
				{ input: data }
			);

			await this.tokenStorage.saveTokens(result.register);

			// Получаем данные пользователя
			const user = await this.getCurrentUserData();

			return {
				success: true,
				data: {
					user,
					tokens: result.register
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Registration failed'
			};
		}
	}

	// ============= Logout =============

	async logout(): Promise<void> {
		await this.tokenStorage.clearTokens();
	}

	// ============= Token Management =============

	async refreshToken(): Promise<AuthResult<AuthTokens>> {
		try {
			const refreshToken = await this.tokenStorage.getRefreshToken();

			if (!refreshToken) {
				return {
					success: false,
					error: 'No refresh token available'
				};
			}

			const mutation = `
				mutation RefreshToken($input: RefreshTokenInput!) {
					refreshToken(input: $input) {
						accessToken
						refreshToken
						tokenType
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ refreshToken: AuthTokens }>(
				mutation,
				{ input: { refreshToken } }
			);

			await this.tokenStorage.saveTokens(result.refreshToken);

			return {
				success: true,
				data: result.refreshToken
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Token refresh failed'
			};
		}
	}

	// ============= Get Current User =============

	async getCurrentUser(): Promise<AuthResult<AuthResponse>> {
		try {
			const tokens = await this.tokenStorage.getTokens();

			if (!tokens) {
				return {
					success: false,
					error: 'Not authenticated'
				};
			}

			const user = await this.getCurrentUserData();

			return {
				success: true,
				data: {
					user,
					tokens
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get current user'
			};
		}
	}

	private async getCurrentUserData() {
		const query = `
			query Me {
				me {
					id
					email
					username
					isActive
					isVerified
					profile {
						id
						firstName
						lastName
						avatar
						language
						timezone
					}
				}
			}
		`;

		const data = await this.graphqlClient.query<{ me: AuthResponse['user'] }>(query);
		return data.me;
	}

	// ============= Password Management =============

	async requestPasswordReset(data: PasswordResetRequest): Promise<AuthResult<MessageResponse>> {
		try {
			const mutation = `
				mutation RequestPasswordReset($input: PasswordResetRequestInput!) {
					requestPasswordReset(input: $input) {
						success
						message
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ requestPasswordReset: MessageResponse }>(
				mutation,
				{ input: data }
			);

			return {
				success: true,
				data: result.requestPasswordReset
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Password reset request failed'
			};
		}
	}

	async resetPassword(data: PasswordReset): Promise<AuthResult<MessageResponse>> {
		try {
			const mutation = `
				mutation ResetPassword($input: PasswordResetInput!) {
					resetPassword(input: $input) {
						success
						message
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ resetPassword: MessageResponse }>(
				mutation,
				{ input: data }
			);

			return {
				success: true,
				data: result.resetPassword
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Password reset failed'
			};
		}
	}

	// ============= Email Verification =============

	async verifyEmail(data: EmailVerification): Promise<AuthResult<MessageResponse>> {
		try {
			const mutation = `
				mutation VerifyEmail($input: EmailVerificationInput!) {
					verifyEmail(input: $input) {
						success
						message
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ verifyEmail: MessageResponse }>(
				mutation,
				{ input: data }
			);

			return {
				success: true,
				data: result.verifyEmail
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Email verification failed'
			};
		}
	}

	async resendVerificationEmail(email: string): Promise<AuthResult<MessageResponse>> {
		try {
			const mutation = `
				mutation ResendVerificationEmail($email: String!) {
					resendVerificationEmail(email: $email) {
						success
						message
					}
				}
			`;

			const result = await this.graphqlClient.mutate<{ resendVerificationEmail: MessageResponse }>(
				mutation,
				{ email }
			);

			return {
				success: true,
				data: result.resendVerificationEmail
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Resend verification email failed'
			};
		}
	}
}

