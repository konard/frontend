/**
 * Auth Context - Dependency Injection Container
 * DIP: Обеспечивает инверсию зависимостей
 * SRP: Управляет инициализацией и предоставлением сервисов
 */

import { TokenStorage } from '../../storage/token';
import { GraphQLAdapter } from '../../adapter/graphql';
import { AuthService } from '../../service/auth';
import { PermissionService } from '../../service/permission';
import type { ITokenStorage, IGraphQLClient } from '$stylist/auth';

class AuthContext {
	private static instance: AuthContext;

	public readonly tokenStorage: ITokenStorage;
	public readonly graphqlClient: IGraphQLClient;
	public readonly authService: AuthService;
	public readonly permissionService: PermissionService;

	private constructor(graphqlEndpoint?: string) {
		// Получаем endpoint из environment переменных или используем переданный
		const endpoint = graphqlEndpoint || import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql/';

		// Debug logging
		if (import.meta.env.VITE_DEBUG === 'true') {
			console.log('[AuthContext] Initializing with endpoint:', endpoint);
		}

		// Инициализируем зависимости снизу вверх
		this.tokenStorage = new TokenStorage();
		this.graphqlClient = new GraphQLAdapter(endpoint, this.tokenStorage);
		this.authService = new AuthService(this.tokenStorage, this.graphqlClient);
		this.permissionService = new PermissionService(this.graphqlClient);
	}

	public static getInstance(graphqlEndpoint?: string): AuthContext {
		if (!AuthContext.instance) {
			AuthContext.instance = new AuthContext(graphqlEndpoint);
		}
		return AuthContext.instance;
	}

	public static reset(): void {
		AuthContext.instance = null as any;
	}
}

// Экспортируем singleton instance
export const authContext = AuthContext.getInstance();

// Экспортируем удобные геттеры
export const getAuthService = () => authContext.authService;
export const getPermissionService = () => authContext.permissionService;
export const getTokenStorage = () => authContext.tokenStorage;

