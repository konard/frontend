/**
 * usePermissions Composable
 * Предоставляет удобный API для работы с правами доступа
 */

import { getPermissionService } from '../../../class/context/auth';

export function usePermissions() {
	const permissionService = getPermissionService();

	function hasPermission(resource: string, action: string): boolean {
		try {
			return permissionService.hasPermission(resource, action);
		} catch {
			return false;
		}
	}

	function canAccess(resource: string, action: string, scope?: string): boolean {
		try {
			return permissionService.canAccess(resource, action, scope);
		} catch {
			return false;
		}
	}

	function hasRole(roleName: string): boolean {
		try {
			return permissionService.hasRole(roleName);
		} catch {
			return false;
		}
	}

	function hasAnyRole(roleNames: string[]): boolean {
		try {
			return permissionService.hasAnyRole(roleNames);
		} catch {
			return false;
		}
	}

	function hasAllRoles(roleNames: string[]): boolean {
		try {
			return permissionService.hasAllRoles(roleNames);
		} catch {
			return false;
		}
	}

	function getRoles() {
		try {
			return permissionService.getRoles();
		} catch {
			return [];
		}
	}

	function getPermissions() {
		try {
			return permissionService.getPermissions();
		} catch {
			return [];
		}
	}

	return {
		hasPermission,
		canAccess,
		hasRole,
		hasAnyRole,
		hasAllRoles,
		getRoles,
		getPermissions
	};
}
