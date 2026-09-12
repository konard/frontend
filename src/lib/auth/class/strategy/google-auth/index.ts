/**
 * Google OAuth Authentication Strategy
 * OCP: Реализует IAuthStrategy
 * SRP: Отвечает только за авторизацию через Google
 */

import type { IAuthStrategy, IGraphQLClient } from '$stylist/auth';
import type { GoogleAuthData, AuthResponse, AuthResult } from '$stylist/auth';
import { AUTH_STRATEGIES } from '$stylist/auth';

export class GoogleAuthStrategy implements IAuthStrategy {
	private graphqlClient: IGraphQLClient;

	constructor(graphqlClient: IGraphQLClient) {
		this.graphqlClient = graphqlClient;
	}

	async authenticate(credentials: unknown): Promise<AuthResult<AuthResponse>> {
		try {
			const { idToken } = credentials as GoogleAuthData;

			const mutation = `
				mutation LoginWithGoogle($input: GoogleAuthInput!) {
					loginWithGoogle(input: $input) {
						accessToken
						refreshToken
						tokenType
					}
				}
			`;

			const data = await this.graphqlClient.mutate<{ loginWithGoogle: { accessToken: string; refreshToken: string; tokenType: string } }>(
				mutation,
				{ input: { idToken } }
			);

			// Получаем данные пользователя, передавая полученный токен
			const user = await this.getUserData(data.loginWithGoogle.accessToken);

			return {
				success: true,
				data: {
					user,
					tokens: data.loginWithGoogle
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Google authentication failed'
			};
		}
	}

	private async getUserData(accessToken: string) {
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

		const data = await this.graphqlClient.query<{ me: AuthResponse['user'] }>(query, undefined, accessToken);
		return data.me;
	}

	getStrategyName(): string {
		return AUTH_STRATEGIES.GOOGLE;
	}
}

