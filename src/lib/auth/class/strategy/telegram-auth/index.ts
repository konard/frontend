/**
 * Telegram Authentication Strategy
 * OCP: Реализует IAuthStrategy
 * SRP: Отвечает только за авторизацию через Telegram
 */

import type { IAuthStrategy, IGraphQLClient } from '$stylist/auth';
import type { TelegramAuthData, AuthResponse, AuthResult } from '$stylist/auth';
import { AUTH_STRATEGIES } from '$stylist/auth';

export class TelegramAuthStrategy implements IAuthStrategy {
	private graphqlClient: IGraphQLClient;

	constructor(graphqlClient: IGraphQLClient) {
		this.graphqlClient = graphqlClient;
	}

	async authenticate(credentials: unknown): Promise<AuthResult<AuthResponse>> {
		try {
			const telegramData = credentials as TelegramAuthData;

			const mutation = `
				mutation LoginWithTelegram($input: TelegramAuthInput!) {
					loginWithTelegram(input: $input) {
						accessToken
						refreshToken
						tokenType
					}
				}
			`;

			const data = await this.graphqlClient.mutate<{ loginWithTelegram: { accessToken: string; refreshToken: string; tokenType: string } }>(
				mutation,
				{
					input: {
						id: telegramData.id,
						hash: telegramData.hash,
						authDate: telegramData.authDate,
						firstName: telegramData.firstName,
						lastName: telegramData.lastName,
						username: telegramData.username,
						photoUrl: telegramData.photoUrl
					}
				}
			);

			// Получаем данные пользователя, передавая полученный токен
			const user = await this.getUserData(data.loginWithTelegram.accessToken);

			return {
				success: true,
				data: {
					user,
					tokens: data.loginWithTelegram
				}
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Telegram authentication failed'
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
		return AUTH_STRATEGIES.TELEGRAM;
	}
}

