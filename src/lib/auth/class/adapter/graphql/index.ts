/**
 * GraphQL Adapter
 * DIP: Реализует интерфейс IGraphQLClient
 * SRP: Отвечает только за коммуникацию с GraphQL API
 */

import type { IGraphQLClient, ITokenStorage } from '$stylist/auth';

export class GraphQLAdapter implements IGraphQLClient {
	private endpoint: string;
	private tokenStorage: ITokenStorage;

	constructor(endpoint: string, tokenStorage: ITokenStorage) {
		this.endpoint = endpoint;
		this.tokenStorage = tokenStorage;
	}

	private async getHeaders(accessToken?: string): Promise<HeadersInit> {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		// Используем переданный токен или берем из storage
		const token = accessToken || await this.tokenStorage.getAccessToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		return headers;
	}

	async query<T>(query: string, variables?: Record<string, unknown>, accessToken?: string): Promise<T> {
		return this.request<T>(query, variables, accessToken);
	}

	async mutate<T>(mutation: string, variables?: Record<string, unknown>, accessToken?: string): Promise<T> {
		return this.request<T>(mutation, variables, accessToken);
	}

	private async request<T>(query: string, variables?: Record<string, unknown>, accessToken?: string): Promise<T> {
		try {
			const headers = await this.getHeaders(accessToken);

			if (import.meta.env.VITE_DEBUG === 'true') {
				console.log('[GraphQLAdapter] Request:', {
					endpoint: this.endpoint,
					query: query.substring(0, 100) + '...',
					variables
				});
			}

			const response = await fetch(this.endpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					query,
					variables
				})
			});

			if (import.meta.env.VITE_DEBUG === 'true') {
				console.log('[GraphQLAdapter] Response status:', response.status, response.statusText);
			}

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[GraphQLAdapter] HTTP Error:', response.status, errorText);

				// Улучшенные сообщения об ошибках для пользователя
				if (response.status === 500) {
					throw new Error('Server error. Please try again later or contact support.');
				} else if (response.status === 503) {
					throw new Error('Service unavailable. The server may be down for maintenance.');
				} else if (response.status === 404) {
					throw new Error('API endpoint not found. Please check your configuration.');
				} else if (response.status === 401) {
					throw new Error('Authentication failed. Please check your credentials.');
				} else if (response.status === 403) {
					throw new Error('Access denied. You do not have permission to perform this action.');
				} else if (response.status >= 500) {
					throw new Error('Server error occurred. Please try again later.');
				} else if (response.status >= 400) {
					throw new Error(`Request error: ${response.statusText}`);
				}

				throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
			}

			const json = await response.json();

			if (json.errors) {
				console.error('[GraphQLAdapter] GraphQL Errors:', json.errors);
				const firstError = json.errors[0];
				const errorMessage = firstError?.message || 'GraphQL request failed';

				// Проверяем, является ли это ошибкой базы данных
				if (errorMessage.includes('psycopg2.errors') || errorMessage.includes('does not exist')) {
					// Это ошибка backend/базы данных - показываем пользователю понятное сообщение
					throw new Error('Server database error. Please contact the administrator to fix the database schema.');
				}

				throw new Error(errorMessage);
			}

			if (import.meta.env.VITE_DEBUG === 'true') {
				console.log('[GraphQLAdapter] Success response received');
			}

			return json.data;
		} catch (error) {
			console.error('[GraphQLAdapter] Request Failed:', error);

			// Обработка сетевых ошибок (сервер недоступен)
			if (error instanceof TypeError && error.message.includes('fetch')) {
				throw new Error('Cannot connect to server. Please check your internet connection or try again later.');
			}

			throw error;
		}
	}
}

