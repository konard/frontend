import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionService } from './index';
import type { IGraphQLClient } from '$stylist/auth';
import type { Role, Permission } from '$stylist/auth';

describe('PermissionService', () => {
	let permissionService: PermissionService;
	let mockGraphQLClient: IGraphQLClient;

	const mockPermissions: Permission[] = [
		{
			id: 1,
			resource: 'users',
			action: 'read',
			scope: 'all',
			roleId: 1
		},
		{
			id: 2,
			resource: 'users',
			action: 'create',
			scope: 'own',
			roleId: 1
		},
		{
			id: 3,
			resource: 'posts',
			action: 'manage',
			scope: 'all',
			roleId: 2
		}
	];

	const mockRoles: Role[] = [
		{
			id: 1,
			name: 'admin',
			description: 'Administrator',
			permissions: [mockPermissions[0], mockPermissions[1]]
		},
		{
			id: 2,
			name: 'editor',
			description: 'Editor',
			permissions: [mockPermissions[2]]
		}
	];

	beforeEach(() => {
		mockGraphQLClient = {
			query: vi.fn(),
			mutate: vi.fn()
		};

		permissionService = new PermissionService(mockGraphQLClient);
	});

	describe('initialize', () => {
		it('should load roles and permissions successfully', async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});

			await permissionService.initialize();

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.stringContaining('query MyRoles')
			);

			const roles = permissionService.getRoles();
			expect(roles).toEqual(mockRoles);

			const permissions = permissionService.getPermissions();
			expect(permissions).toHaveLength(3);
		});

		it('should throw error on initialization failure', async () => {
			const errorMessage = 'Network error';
			vi.spyOn(mockGraphQLClient, 'query').mockRejectedValue(new Error(errorMessage));

			await expect(permissionService.initialize()).rejects.toThrow(errorMessage);
		});

		it('should extract all permissions from roles', async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});

			await permissionService.initialize();

			const permissions = permissionService.getPermissions();
			expect(permissions).toEqual(mockPermissions);
		});
	});

	describe('hasPermission', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return true when user has permission', () => {
			expect(permissionService.hasPermission('users', 'read')).toBe(true);
			expect(permissionService.hasPermission('users', 'create')).toBe(true);
			expect(permissionService.hasPermission('posts', 'manage')).toBe(true);
		});

		it('should return false when user does not have permission', () => {
			expect(permissionService.hasPermission('users', 'delete')).toBe(false);
			expect(permissionService.hasPermission('posts', 'read')).toBe(false);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.hasPermission('users', 'read')).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('canAccess', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should check permission without scope', () => {
			expect(permissionService.canAccess('users', 'read')).toBe(true);
			expect(permissionService.canAccess('users', 'delete')).toBe(false);
		});

		it('should check permission with scope', () => {
			expect(permissionService.canAccess('users', 'read', 'all')).toBe(true);
			expect(permissionService.canAccess('users', 'create', 'own')).toBe(true);
			expect(permissionService.canAccess('users', 'read', 'own')).toBe(false);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.canAccess('users', 'read')).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('hasRole', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return true when user has role', () => {
			expect(permissionService.hasRole('admin')).toBe(true);
			expect(permissionService.hasRole('editor')).toBe(true);
		});

		it('should return false when user does not have role', () => {
			expect(permissionService.hasRole('moderator')).toBe(false);
			expect(permissionService.hasRole('user')).toBe(false);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.hasRole('admin')).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('hasAnyRole', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return true when user has any of the roles', () => {
			expect(permissionService.hasAnyRole(['admin', 'moderator'])).toBe(true);
			expect(permissionService.hasAnyRole(['editor', 'user'])).toBe(true);
		});

		it('should return false when user has none of the roles', () => {
			expect(permissionService.hasAnyRole(['moderator', 'user'])).toBe(false);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.hasAnyRole(['admin'])).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('hasAllRoles', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return true when user has all roles', () => {
			expect(permissionService.hasAllRoles(['admin', 'editor'])).toBe(true);
		});

		it('should return false when user does not have all roles', () => {
			expect(permissionService.hasAllRoles(['admin', 'moderator'])).toBe(false);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.hasAllRoles(['admin'])).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('getRoles', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return copy of roles array', () => {
			const roles = permissionService.getRoles();
			expect(roles).toEqual(mockRoles);

			// Verify it's a copy, not reference
			roles.push({
				id: 3,
				name: 'test',
				description: 'Test',
				permissions: []
			});

			expect(permissionService.getRoles()).toHaveLength(2);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.getRoles()).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('getPermissions', () => {
		beforeEach(async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});
			await permissionService.initialize();
		});

		it('should return copy of permissions array', () => {
			const permissions = permissionService.getPermissions();
			expect(permissions).toEqual(mockPermissions);

			// Verify it's a copy, not reference
			permissions.push({
				id: 4,
				resource: 'test',
				action: 'test',
				scope: 'test',
				roleId: 1
			});

			expect(permissionService.getPermissions()).toHaveLength(3);
		});

		it('should throw error if not initialized', () => {
			const uninitializedService = new PermissionService(mockGraphQLClient);

			expect(() => uninitializedService.getPermissions()).toThrow(
				'PermissionService is not initialized'
			);
		});
	});

	describe('refresh', () => {
		it('should reload roles and permissions', async () => {
			const initialRoles = [mockRoles[0]];
			const updatedRoles = mockRoles;

			vi.spyOn(mockGraphQLClient, 'query')
				.mockResolvedValueOnce({ myRoles: initialRoles })
				.mockResolvedValueOnce({ myRoles: updatedRoles });

			await permissionService.initialize();
			expect(permissionService.getRoles()).toHaveLength(1);

			await permissionService.refresh();
			expect(permissionService.getRoles()).toHaveLength(2);
		});
	});

	describe('clear', () => {
		it('should clear all roles and permissions', async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});

			await permissionService.initialize();
			expect(permissionService.getRoles()).toHaveLength(2);

			permissionService.clear();

			expect(() => permissionService.getRoles()).toThrow(
				'PermissionService is not initialized'
			);
		});

		it('should reset initialized state', async () => {
			vi.spyOn(mockGraphQLClient, 'query').mockResolvedValue({
				myRoles: mockRoles
			});

			await permissionService.initialize();
			permissionService.clear();

			expect(() => permissionService.hasRole('admin')).toThrow(
				'PermissionService is not initialized'
			);
		});
	});
});

