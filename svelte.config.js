import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylistPath = existsSync(resolve(__dirname, '../stylist-svelte/src/lib'))
	? resolve(__dirname, '../stylist-svelte/src/lib')
	: resolve(__dirname, 'stylist-svelte/src/lib');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	// stylist-svelte's mandatory architecture (AGENTS.md) passes `$props()` into
	// `function/state/<name>` factories that internally wrap every read in `$derived`.
	// The Svelte compiler can't statically verify that and flags every call site with
	// `state_referenced_locally`, even though reactivity is preserved. Silence just
	// that code; let every other warning through unchanged.
	onwarn: (warning, defaultHandler) => {
		if (warning.code === 'state_referenced_locally') return;
		defaultHandler(warning);
	},
	kit: {
        adapter: adapter(),

        alias: {
            $houdini:  ".houdini/",
            $stylist:  stylistPath,
            $frontend: resolve(__dirname, 'src'),
            $pages:    resolve(__dirname, 'src/pages')
        }
    }
};

export default config;
