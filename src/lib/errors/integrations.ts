/**
 * Integration between error handler and notification system
 */

import { errorHandler } from './ErrorHandler';
import { notificationStore } from '$lib/stores/notification.store.svelte';
import { ErrorSeverity, ErrorType, type AppError } from './types';

/**
 * Initialize error to notification integration
 */
export function initializeErrorNotifications(): () => void {
	return errorHandler.onError((error: AppError) => {
		// Get user-friendly message
		const message = error.getUserMessage();

		// Determine notification type based on error severity
		switch (error.severity) {
			case ErrorSeverity.INFO:
				notificationStore.info(message, {
					title: getErrorTitle(error.type)
				});
				break;

			case ErrorSeverity.WARNING:
				notificationStore.warning(message, {
					title: getErrorTitle(error.type)
				});
				break;

			case ErrorSeverity.ERROR:
				notificationStore.error(message, {
					title: getErrorTitle(error.type),
					duration: 7000
				});
				break;

			case ErrorSeverity.CRITICAL:
				notificationStore.error(message, {
					title: 'Critical Error',
					duration: 0, // Don't auto-dismiss critical errors
					actions: [{ label: 'Reload Page', onClick: () => window.location.reload() }]
				});
				break;
		}
	});
}

/**
 * Get error title based on type
 */
function getErrorTitle(type: ErrorType): string {
	switch (type) {
		case ErrorType.NETWORK:
			return 'Network Error';
		case ErrorType.AUTHENTICATION:
			return 'Authentication Error';
		case ErrorType.AUTHORIZATION:
			return 'Permission Denied';
		case ErrorType.NOT_FOUND:
			return 'Not Found';
		case ErrorType.VALIDATION:
			return 'Validation Error';
		case ErrorType.SERVER:
			return 'Server Error';
		default:
			return 'Error';
	}
}
