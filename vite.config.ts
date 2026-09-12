import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import houdini from 'houdini/vite';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Stylist-svelte может быть на ../stylist-svelte (frontend в /app/frontend)
// или на ./stylist-svelte (frontend в /app — старый Docker-образ)
const stylistPath = existsSync(path.resolve(__dirname, '../stylist-svelte/src/lib'))
	? path.resolve(__dirname, '../stylist-svelte/src/lib')
	: path.resolve(__dirname, 'stylist-svelte/src/lib');

// Patch for houdini-svelte 3.0.0-next.35 + Svelte 5 bug:
// the injected $effect calls extractSession(page.data) where page is the
// store object (not its value), so val === undefined → TypeError.
// This transform adds a null guard before the throw site.
function houdiniSessionFix() {
	return {
		name: 'houdini-session-fix',
		enforce: 'post' as const,
		transform(code: string, id: string) {
			if (!id.includes('.houdini') || !id.includes('session')) return null;
			if (code.includes('if (!val) return')) return null; // already patched
			const patched = code.replace(
				/return val\[sessionKeyName\]/,
				'if (!val) return undefined;\n\treturn val[sessionKeyName]'
			);
			return patched !== code ? { code: patched, map: null } : null;
		}
	};
}

export default defineConfig({
	plugins: [houdini(), sveltekit(), houdiniSessionFix()],
	resolve: {
		alias: {
			$stylist: stylistPath,
			$frontend: path.resolve(__dirname, 'src')
		}
	},
	css: {
		postcss: {}
	},
	server: {
		fs: {
			allow: ['.', '..', '.houdini', 'src', 'node_modules', '.svelte-kit', '../stylist-svelte']
		},
		proxy: {
			'/graphql': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/graphql$/, '/graphql/')
			}
		}
	},
	ssr: {
		noExternal: ['stylist-svelte']
	},
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/build/**',
				'**/.svelte-kit/**',
				'**/coverage/**',
				'**/*.config.*',
				'**/demo.spec.ts',
				'**/*.spec.ts',
				'**/*.test.ts',
				'**/types.ts',
				'**/constants.ts',
				'**/$houdini/**',
				'**/houdini.config.js',
				'**/playwright.config.ts',
				'**/svelte.config.js'
			],
			// Coverage thresholds (80%+ goal)
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 75,
				statements: 80
			},
			// Include all source files in coverage report
			all: true,
			include: ['src/**/*.{js,ts,svelte}']
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					// `environment` must stay unset here: vitest 4 rejects
					// `environment: 'browser'` in favour of `browser.enabled`.
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
