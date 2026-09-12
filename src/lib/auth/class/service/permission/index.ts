/**
 * Permission Service
 * SRP: Отвечает только за проверку прав доступа
 * DIP: Зависит от абстракций (интерфейсов)
 */

import type { IPermissionChecker, IGraphQLClient } from '$stylist/auth';
import type { Role, Permission } from '$stylist/auth';

export class PermissionService implements IPermissionChecker {
	private graphqlClient: IGraphQLClient;
	private roles: Role[] = [];
	private permissions: Permission[] = [];
	private initialized: boolean = false;

	constructor(graphqlClient: IGraphQLClient) {
		this.graphqlClient = graphqlClient;
	}

	// ============= Initialization =============

	async initialize(): Promise<void> {
		try {
			await this.loadRoles();
			this.extractPermissions();
			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize permissions:', error);
			throw error;
		}
	}

	private async loadRoles(): Promise<void> {
		const query = `
			query MyRoles {
				myRoles {
					id
					name
					description
					permissions {
						id
						resource
						action
						scope
						roleId
					}
				}
			}
		`;

		const data = await this.graphqlClient.query<{ myRoles: Role[] | null | undefined }>(query);
		// Defensively assign roles, even though a backend error should ideally prevent reaching this.
		// The actual 'NoneType' error indicates a backend issue with role mapping.
		this.roles = data?.myRoles || [];
	}

	private extractPermissions(): void {
		this.permissions = this.roles.flatMap(role => role.permissions);
	}

	// ============= Permission Checks =============

	hasPermission(resource: string, action: string): boolean {
		this.ensureInitialized();

		return this.permissions.some(
			permission =>
				permission.resource === resource &&
				permission.action === action
		);
	}

	canAccess(resource: string, action: string, scope?: string): boolean {
		this.ensureInitialized();

		return this.permissions.some(permission => {
			const resourceMatch = permission.resource === resource;
			const actionMatch = permission.action === action;
			const scopeMatch = scope ? permission.scope === scope : true;

			return resourceMatch && actionMatch && scopeMatch;
		});
	}

	// ============= Role Checks =============

	hasRole(roleName: string): boolean {
		this.ensureInitialized();
		return this.roles.some(role => role.name === roleName);
	}

	hasAnyRole(roleNames: string[]): boolean {
		this.ensureInitialized();
		return roleNames.some(roleName => this.hasRole(roleName));
	}

	hasAllRoles(roleNames: string[]): boolean {
		this.ensureInitialized();
		return roleNames.every(roleName => this.hasRole(roleName));
	}

	// ============= Getters =============

	getRoles(): Role[] {
		this.ensureInitialized();
		return [...this.roles];
	}

	getPermissions(): Permission[] {
		this.ensureInitialized();
		return [...this.permissions];
	}

	// ============= Helpers =============

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error('PermissionService is not initialized. Call initialize() first.');
		}
	}

	// ============= Refresh =============

	async refresh(): Promise<void> {
		await this.initialize();
	}

	// ============= Clear =============

	clear(): void {
		this.roles = [];
		this.permissions = [];
		this.initialized = false;
	}
}

