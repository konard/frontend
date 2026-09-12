import type { Handle } from '@sveltejs/kit';

// Force the Houdini client module to fully evaluate before any route's load()
// runs. Without this, the *first* SSR request after a cold dev-server start
// can hit a race: `+layout.ts` calls into `.houdini/.../stores/query.ts`,
// which does `await initClient()` -> `await import('.../src/client')` for the
// first time, concurrently with that same client module still being reached
// through the `$houdini` barrel's own import graph. The dynamic import can
// resolve with `.default` still undefined, `initClient()` returns undefined,
// and `client.throwOnError_operations` throws -- uncaught, killing the whole
// Node process (no route-level error boundary catches it). A static
// side-effect import here runs to completion during hooks module evaluation,
// which SvelteKit always finishes before invoking `handle` for the first
// request, so by the time any load() function reaches Houdini's lazy
// `initClient()`, the module is already resolved and cached.
import './client';

/**
 * Server-side hooks
 * Настраивает GraphQL endpoint для SSR запросов
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Установить правильный GraphQL endpoint для server-side запросов
	// В Docker контейнере используем internal network endpoint, иначе локальный
	const isDocker = process.env.BACKEND_URL || process.env.API_BASE_URL;
	const isDev = process.env.NODE_ENV !== 'production';
	
	if (isDocker) {
		// Сохраняем server-side GraphQL endpoint в event.locals для использования в load функциях
		event.locals.graphqlEndpoint =
			process.env.API_BASE_URL ||
			`${process.env.BACKEND_URL}/graphql/` ||
			'http://backend:8000/graphql/';
	} else {
		// Для локальной разработки используем локальный адрес
		event.locals.graphqlEndpoint = process.env.VITE_GRAPHQL_ENDPOINT || 'http://127.0.0.1:8000/graphql/';
	}

	const response = await resolve(event);
	return response;
};
