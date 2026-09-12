/**
 * Email/Password Authentication Strategy
 * OCP: Реализует IAuthStrategy, позволяет добавлять новые стратегии без изменения существующих
 * SRP: Отвечает только за авторизацию через email/password
 */

import type { IAuthStrategy, IGraphQLClient } from '$stylist/auth';
import type { LoginCredentials, AuthResponse, AuthResult } from '$stylist/auth';
import { AUTH_STRATEGIES } from '$stylist/auth';

export class EmailPasswordStrategy implements IAuthStrategy {
	private graphqlClient: IGraphQLClient;

	constructor(graphqlClient: IGraphQLClient) {
		this.graphqlClient = graphqlClient;
	}

	async authenticate(credentials: unknown): Promise<AuthResult<AuthResponse>> {
		try {
			const { username, password } = credentials as LoginCredentials;

			const mutation = `
				mutation Login($input: UserLoginInput!) {
					login(input: $input) {
						accessToken
						refreshToken
						tokenType
					}
				}
			`;

			const data = await this.graphqlClient.mutate<{ login: { accessToken: string; refreshToken: string; tokenType: string } }>(
				mutation,
				{ input: { username, password } }
			);

			// Получаем данные пользователя, передавая полученный токен
			const user = await this.getUserData(data.login.accessToken);

			return {
				success: true,
				data: {
					user,
					tokens: data.login
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed'
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
		return AUTH_STRATEGIES.EMAIL_PASSWORD;
	}
}

